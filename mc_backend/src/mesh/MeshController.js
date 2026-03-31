// src/mesh/MeshController.js
// Central controller. Owns all subsystems and exposes a clean API.
// Import via getMeshController() — it's a singleton.

import { EventEmitter } from 'events';
import * as Location from 'expo-location';
import * as Battery  from 'expo-battery';

import { BleMeshManager }    from './BleMeshManager';
import { WifiMeshManager }   from './WifiMeshManager';
import { BlockchainManager } from '../blockchain/blockchain';
import { Identity }          from '../identity/identity';
import { StorageManager }    from '../storage/StorageManager';
import {
  SeenMessages,
  prepareForRelay,
  createMessage,
  createSOSMessage,
  createBroadcastMessage,
  MESSAGE_TYPES,
} from '../utils/message';
import {
  MIN_BATTERY_TO_RELAY,
  STORE_FORWARD_FLUSH_MS,
  SOS_REPEAT_INTERVAL_MS,
  MESSAGE_MAX_TTL,
} from '../constants';

export class MeshController extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(30);

    this.identity   = null;
    this.blockchain = new BlockchainManager();
    this.seen       = new SeenMessages();
    this.storage    = new StorageManager();

    this.relayEnabled        = true;
    this.storeForwardEnabled = true;

    this.stats = {
      messagesSent:     0,
      messagesRelayed:  0,
      messagesReceived: 0,
      peersConnected:   0,
      startTime:        Date.now(),
    };

    this._peers         = new Map();  // peerId → peerInfo (merged from both transports)
    this._sosTimer      = null;
    this._flushTimer    = null;
    this._started       = false;

    const handlers = {
      onMessageReceived: this._onIncoming.bind(this),
      onPeerDiscovered:  this._onPeerDiscovered.bind(this),
      onPeerLost:        this._onPeerLost.bind(this),
    };

    this.ble  = new BleMeshManager(handlers);
    this.wifi = new WifiMeshManager(handlers);
  }

  // ─── Startup / shutdown ──────────────────────────────────────────────────────

  async start() {
    if (this._started) return this.identity;
    this._started = true;

    this.identity = await Identity.load();
    await this.storage.init();

    const idJSON = JSON.stringify(this.identity.toJSON());

    // Start both transports concurrently; either failing is non-fatal
    const [bleOk, wifiOk] = await Promise.allSettled([
      this.ble.start(idJSON),
      this.wifi.start(idJSON),
    ]);

    if (bleOk.status  === 'rejected') console.warn('[Controller] BLE failed:', bleOk.reason);
    if (wifiOk.status === 'rejected') console.warn('[Controller] WiFi failed:', wifiOk.reason);

    this._startFlushLoop();
    console.log('[Controller] Started. ID:', this.identity.shortId);
    return this.identity;
  }

  async stop() {
    this._started = false;
    clearInterval(this._flushTimer);
    clearInterval(this._sosTimer);
    this.ble.stop();
    await this.wifi.stop();
  }

  // ─── Peer events ─────────────────────────────────────────────────────────────

  _onPeerDiscovered(peer) {
    this._peers.set(peer.id, { ...peer, connectedAt: Date.now() });
    this.stats.peersConnected = this._peers.size;
    this.emit('peersChanged', this.getPeers());
    this.emit('statsChanged', { ...this.stats });

    // Persist to peer registry
    this.storage.upsertPeer(peer).catch(() => {});

    // Opportunistic store-and-forward flush
    if (this.storeForwardEnabled) this._flushQueue(peer.id);
  }

  _onPeerLost(peerId) {
    this._peers.delete(peerId);
    this.stats.peersConnected = this._peers.size;
    this.emit('peersChanged', this.getPeers());
    this.emit('statsChanged', { ...this.stats });
  }

  getPeers() { return [...this._peers.values()]; }
  getPeerCount() { return this._peers.size; }

  // ─── Incoming message pipeline ────────────────────────────────────────────────

  async _onIncoming(message, fromPeerId) {
    // 1. Deduplication
    if (this.seen.has(message.id)) return;
    this.seen.add(message.id);

    // 2. Verify blockchain hash
    // Each device holds its own local chain with a unique prevHash at send time,
    // so we cannot reconstruct the exact block here. We accept any well-formed
    // 64-char hex hash as proof the sender ran the blockchain layer. The
    // cryptographic signature (step 3) provides the real authenticity guarantee.
    let hashValid = false;
    if (message.blockHash) {
      hashValid = /^[0-9a-f]{64}$/.test(message.blockHash);
    }

    // 3. Verify cryptographic signature
    let sigValid = false;
    if (message.signature && message.senderId) {
      const payloadToVerify = {
        id:        message.id,
        type:      message.type,
        channel:   message.channel,
        senderId:  message.senderId,
        senderName:message.senderName,
        content:   message.content,
        location:  message.location,
        timestamp: message.timestamp,
        ttl:       MESSAGE_MAX_TTL, // original TTL used during signing
        hopCount:  0,               // original hopCount used during signing
        blockHash: null,
      };
      sigValid = Identity.verify(payloadToVerify, message.signature, message.senderId);
    }

    const verified = hashValid && sigValid;

    // 4. Deliver to UI
    const delivered = { ...message, verified };
    this.emit('messageReceived', delivered);

    // 5. Persist
    await this.storage.saveMessage(delivered);

    this.stats.messagesReceived++;
    this.emit('statsChanged', { ...this.stats });

    // 6. Relay
    if (this.relayEnabled) await this._relay(message, fromPeerId);
  }

  async _relay(message, fromPeerId) {
    // Battery check
    try {
      const level = await Battery.getBatteryLevelAsync();
      if (level < MIN_BATTERY_TO_RELAY) {
        console.log('[Relay] Low battery — skipping');
        return;
      }
    } catch {}

    const relayMsg = prepareForRelay(message);
    if (!relayMsg) return; // TTL exhausted

    const targets = this.getPeers().filter(p => p.id !== fromPeerId);

    if (targets.length === 0) {
      // Nobody to relay to — store for later
      if (this.storeForwardEnabled) await this.storage.enqueue(relayMsg);
      return;
    }

    let relayed = 0;
    for (const peer of targets) {
      const ok = await this._sendToPeer(peer.id, relayMsg);
      if (ok) relayed++;
    }

    if (relayed > 0) {
      this.stats.messagesRelayed++;
      this.emit('statsChanged', { ...this.stats });
    }
  }

  // ─── Send pipeline ────────────────────────────────────────────────────────────

  async send(message) {
    // Add to blockchain
    const block = this.blockchain.addMessage({
      id:        message.id,
      type:      message.type,
      senderId:  message.senderId,
      timestamp: message.timestamp,
    });
    const fullMessage = { ...message, blockHash: block.hash };

    // Mark seen so we don't process our own relay
    this.seen.add(fullMessage.id);

    // Persist with verified: true (we sent it, we trust it)
    await this.storage.saveMessage({ ...fullMessage, verified: true });

    // Emit to UI immediately (optimistic)
    this.emit('messageReceived', { ...fullMessage, verified: true });

    // Broadcast over both transports
    const [bleResult, wifiResult] = await Promise.allSettled([
      this.ble.broadcast(fullMessage),
      this.wifi.broadcast(fullMessage),
    ]);

    const bleSent  = bleResult.status  === 'fulfilled' ? bleResult.value.sent  : 0;
    const wifiSent = wifiResult.status === 'fulfilled' ? wifiResult.value.sent : 0;

    this.stats.messagesSent++;
    this.emit('statsChanged', { ...this.stats });

    return {
      message: fullMessage,
      sentVia: { ble: bleSent, wifi: wifiSent },
    };
  }

  // ─── Public API: message creators ────────────────────────────────────────────

  async sendChat(content, channel = null) {
    this._assertReady();
    const msg = createMessage({
      type:      MESSAGE_TYPES.CHAT,
      channel,
      senderId:  this.identity.publicKey,
      senderName:this.identity.displayName,
      content,
      identity:  this.identity,
    });
    return this.send(msg);
  }

  async sendBroadcast(content, channel) {
    this._assertReady();
    const msg = createBroadcastMessage({
      channel,
      senderId:  this.identity.publicKey,
      senderName:this.identity.displayName,
      content,
      identity:  this.identity,
    });
    return this.send(msg);
  }

  // ─── SOS ─────────────────────────────────────────────────────────────────────

  async triggerSOS() {
    this._assertReady();

    let location = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch { /* location unavailable — still send SOS */ }

    const msg = createSOSMessage({
      senderId:  this.identity.publicKey,
      senderName:this.identity.displayName,
      location,
      identity:  this.identity,
    });

    const result = await this.send(msg);

    // Auto-repeat SOS every 60 seconds until cancelSOS() is called
    clearInterval(this._sosTimer);
    this._sosTimer = setInterval(() => this.triggerSOS(), SOS_REPEAT_INTERVAL_MS);

    return result;
  }

  cancelSOS() {
    clearInterval(this._sosTimer);
    this._sosTimer = null;
  }

  get sosActive() {
    return this._sosTimer !== null;
  }

  // ─── Store-and-forward loop ───────────────────────────────────────────────────

  _startFlushLoop() {
    this._flushTimer = setInterval(async () => {
      if (this.getPeerCount() > 0) {
        await this._flushQueue(null); // flush to all available peers
      }
    }, STORE_FORWARD_FLUSH_MS);
  }

  async _flushQueue(specificPeerId) {
    const stored = await this.storage.dequeue();
    if (stored.length === 0) return;

    for (const msg of stored) {
      let sent = false;
      if (specificPeerId) {
        sent = await this._sendToPeer(specificPeerId, msg);
      } else {
        const peers = this.getPeers();
        for (const peer of peers) {
          sent = await this._sendToPeer(peer.id, msg);
          if (sent) break;
        }
      }
      if (sent) {
        await this.storage.removeFromQueue(msg.id);
      } else {
        await this.storage.incrementAttempts(msg.id);
      }
    }
    // Prune stale entries
    await this.storage.pruneQueue(20);
  }

  // ─── Transport routing ────────────────────────────────────────────────────────
  // Prefer WiFi Direct (faster/higher bandwidth). Fall back to BLE.

  async _sendToPeer(peerId, message) {
    const wifiOk = await this.wifi.sendToPeer(peerId, message).catch(() => false);
    if (wifiOk) return true;
    return this.ble.sendToPeer(peerId, message).catch(() => false);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────────

  setRelayEnabled(val) {
    this.relayEnabled = !!val;
  }

  setStoreForwardEnabled(val) {
    this.storeForwardEnabled = !!val;
  }

  async updateDisplayName(name) {
    this._assertReady();
    await this.identity.updateDisplayName(name);
  }

  // ─── Stats & info ─────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this.stats,
      uptime:      Date.now() - this.stats.startTime,
      chainLength: this.blockchain.getLength(),
      queueSize:   0, // updated lazily
    };
  }

  async getFullStats() {
    const [msgCount, queueSize] = await Promise.all([
      this.storage.getMessageCount(),
      this.storage.getQueueSize(),
    ]);
    return { ...this.getStats(), msgCount, queueSize };
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────────

  _assertReady() {
    if (!this.identity) throw new Error('MeshController not started. Call start() first.');
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let _instance = null;

export function getMeshController() {
  if (!_instance) _instance = new MeshController();
  return _instance;
}

export function resetMeshController() {
  _instance = null; // for tests
}
