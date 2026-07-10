// src/mesh/BleMeshManager.js
// Bluetooth Low Energy transport layer.
// Handles device scanning, connection, chunked message transfer,
// and identity exchange with peers.

import { BleManager, State } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import {
  BLE_SERVICE_UUID,
  BLE_MESSAGE_CHAR_UUID,
  BLE_IDENTITY_CHAR_UUID,
  BLE_MAX_CHUNK_BYTES,
  BLE_SCAN_RESTART_DELAY,
} from '../constants';

export class BleMeshManager {
  constructor({ onMessageReceived, onPeerDiscovered, onPeerLost }) {
    this._manager       = new BleManager();
    this._peers         = new Map();   // deviceId → { device, identity }
    this._chunks        = new Map();   // msgId    → chunks[]
    this._scanning      = false;
    this._scanSub       = null;
    this._stateSub      = null;

    this.onMessageReceived = onMessageReceived;
    this.onPeerDiscovered  = onPeerDiscovered;
    this.onPeerLost        = onPeerLost;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async start(myIdentityJSON) {
    this._myIdentityJSON = myIdentityJSON;

    // Wait for BLE to power on
    const state = await this._manager.state();
    if (state !== State.PoweredOn) {
      await new Promise(resolve => {
        this._stateSub = this._manager.onStateChange(s => {
          if (s === State.PoweredOn) {
            this._stateSub.remove();
            this._stateSub = null;
            resolve();
          }
        }, true);
      });
    }
    this._scan();
  }

  stop() {
    this._scanning = false;
    this._scanSub?.remove();
    this._stateSub?.remove();
    this._manager.stopDeviceScan();
    for (const { device } of this._peers.values()) {
      device.cancelConnection().catch(() => {});
    }
    this._peers.clear();
    this._manager.destroy();
  }

  // ─── Scanning ───────────────────────────────────────────────────────────────

  _scan() {
    if (this._scanning) return;
    this._scanning = true;

    this._manager.startDeviceScan(
      [BLE_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.warn('[BLE] Scan error:', error.message);
          this._scanning = false;
          setTimeout(() => this._scan(), BLE_SCAN_RESTART_DELAY);
          return;
        }
        if (device && !this._peers.has(device.id)) {
          this._connect(device);
        }
      }
    );
  }

  // ─── Connection ─────────────────────────────────────────────────────────────

  async _connect(device) {
    try {
      const connected = await device.connect({ autoConnect: false });
      await connected.discoverAllServicesAndCharacteristics();

      // Read peer's identity (display name + public key)
      let identity = null;
      try {
        const char = await connected.readCharacteristicForService(
          BLE_SERVICE_UUID, BLE_IDENTITY_CHAR_UUID
        );
        identity = JSON.parse(Buffer.from(char.value, 'base64').toString('utf8'));
      } catch {
        identity = { displayName: device.name ?? 'Unknown', publicKey: null };
      }

      this._peers.set(device.id, { device: connected, identity });

      // Subscribe to incoming message chunks
      connected.monitorCharacteristicForService(
        BLE_SERVICE_UUID,
        BLE_MESSAGE_CHAR_UUID,
        (err, char) => {
          if (err) { console.warn('[BLE] Monitor error:', err.message); return; }
          if (char?.value) this._handleChunk(device.id, char.value);
        }
      );

      // Handle disconnect
      connected.onDisconnected(() => {
        this._peers.delete(device.id);
        this.onPeerLost?.(device.id);
        console.log('[BLE] Disconnected:', device.id);
      });

      this.onPeerDiscovered?.({
        id:             device.id,
        name:           identity.displayName,
        publicKey:      identity.publicKey,
        connectionType: 'BLE',
        rssi:           device.rssi ?? null,
      });

      console.log('[BLE] Connected to', identity.displayName);
    } catch (err) {
      console.warn('[BLE] Connect failed:', device.id, err.message);
    }
  }

  // ─── Chunking ────────────────────────────────────────────────────────────────
  // BLE characteristic writes max out at 512 bytes. Large messages are split
  // into numbered chunks and reassembled on the receiving end.

  _chunkify(messageJson) {
    const bytes = Buffer.from(messageJson, 'utf8');

    if (bytes.length <= BLE_MAX_CHUNK_BYTES) {
      const envelope = JSON.stringify({ msgId: '__single__', i: 0, n: 1, d: messageJson });
      return [Buffer.from(envelope).toString('base64')];
    }

    const msgId  = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += BLE_MAX_CHUNK_BYTES) {
      const slice = bytes.slice(i, i + BLE_MAX_CHUNK_BYTES).toString('utf8');
      chunks.push(
        Buffer.from(JSON.stringify({
          msgId,
          i:    chunks.length,
          n:    Math.ceil(bytes.length / BLE_MAX_CHUNK_BYTES),
          d:    slice,
        })).toString('base64')
      );
    }
    return chunks;
  }

  _handleChunk(deviceId, b64value) {
    try {
      const chunk = JSON.parse(Buffer.from(b64value, 'base64').toString('utf8'));

      if (chunk.msgId === '__single__') {
        this.onMessageReceived?.(JSON.parse(chunk.d), deviceId);
        return;
      }

      if (!this._chunks.has(chunk.msgId)) {
        this._chunks.set(chunk.msgId, new Array(chunk.n).fill(null));
      }
      const arr = this._chunks.get(chunk.msgId);
      arr[chunk.i] = chunk.d;

      if (arr.every(c => c !== null)) {
        this._chunks.delete(chunk.msgId);
        try {
          this.onMessageReceived?.(JSON.parse(arr.join('')), deviceId);
        } catch (e) {
          console.warn('[BLE] Reassembly parse error:', e.message);
        }
      }
    } catch (err) {
      console.warn('[BLE] Chunk parse error:', err.message);
    }
  }

  // ─── Sending ─────────────────────────────────────────────────────────────────

  async sendToPeer(deviceId, message) {
    const peer = this._peers.get(deviceId);
    if (!peer) return false;
    try {
      const chunks = this._chunkify(JSON.stringify(message));
      for (const chunk of chunks) {
        await peer.device.writeCharacteristicWithResponseForService(
          BLE_SERVICE_UUID, BLE_MESSAGE_CHAR_UUID, chunk
        );
      }
      return true;
    } catch (err) {
      console.warn('[BLE] Send failed to', deviceId, err.message);
      return false;
    }
  }

  async broadcast(message) {
    const ids     = [...this._peers.keys()];
    const results = await Promise.allSettled(ids.map(id => this.sendToPeer(id, message)));
    const sent    = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return { sent, total: ids.length };
  }

  // ─── Accessors ────────────────────────────────────────────────────────────────

  getPeers() {
    return [...this._peers.entries()].map(([id, { identity }]) => ({
      id,
      name:           identity?.displayName ?? 'Unknown',
      publicKey:      identity?.publicKey   ?? null,
      connectionType: 'BLE',
    }));
  }

  getPeerCount() { return this._peers.size; }
}
