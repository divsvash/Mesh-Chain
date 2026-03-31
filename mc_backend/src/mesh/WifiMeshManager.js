// src/mesh/WifiMeshManager.js
// WiFi Direct transport layer (Android only).
// Higher throughput and range than BLE. Used for faster delivery when available.
// Falls back gracefully — BLE handles iOS and sparse environments.

import { Platform } from 'react-native';
import { WIFI_SOCKET_PORT, WIFI_RECONNECT_DELAY } from '../constants';

// react-native-wifi-p2p is Android only. We guard every call.
let wifi = null;
if (Platform.OS === 'android') {
  wifi = require('react-native-wifi-p2p');
}

export class WifiMeshManager {
  constructor({ onMessageReceived, onPeerDiscovered, onPeerLost }) {
    this._peers   = new Map();   // deviceAddress → peerInfo
    this._sockets = new Map();   // deviceAddress → WebSocket | net.Socket
    this._active  = false;
    this._myIdentityJSON = null;
    this._peersSub  = null;
    this._connSub   = null;

    this.onMessageReceived = onMessageReceived;
    this.onPeerDiscovered  = onPeerDiscovered;
    this.onPeerLost        = onPeerLost;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async start(myIdentityJSON) {
    if (Platform.OS !== 'android') {
      console.log('[WiFi] Skipped — Android only');
      return false;
    }
    this._myIdentityJSON = myIdentityJSON;

    try {
      await wifi.initialize();
      this._active = true;

      this._peersSub = wifi.subscribeOnPeersUpdates(({ devices }) => {
        this._handlePeersUpdate(devices || []);
      });

      this._connSub = wifi.subscribeOnConnectionInfoUpdates(info => {
        if (info?.groupFormed) this._handleGroupFormed(info);
      });

      await wifi.startDiscoveringPeers();
      console.log('[WiFi] Discovery started');
      return true;
    } catch (err) {
      console.warn('[WiFi] Start failed:', err.message);
      return false;
    }
  }

  async stop() {
    if (!this._active) return;
    this._active = false;
    this._peersSub?.();
    this._connSub?.();
    try {
      await wifi.stopDiscoveringPeers();
      await wifi.disconnect();
    } catch {}
    for (const sock of this._sockets.values()) {
      try { sock.close?.(); sock.destroy?.(); } catch {}
    }
    this._sockets.clear();
    this._peers.clear();
  }

  // ─── Peer discovery ──────────────────────────────────────────────────────────

  _handlePeersUpdate(devices) {
    const currentAddrs = new Set(devices.map(d => d.deviceAddress));

    // Detect lost peers
    for (const addr of [...this._peers.keys()]) {
      if (!currentAddrs.has(addr)) {
        this._peers.delete(addr);
        this._sockets.get(addr)?.close?.();
        this._sockets.delete(addr);
        this.onPeerLost?.(addr);
      }
    }

    // Discover new peers
    for (const device of devices) {
      if (!this._peers.has(device.deviceAddress)) {
        const peer = {
          id:             device.deviceAddress,
          name:           device.deviceName ?? 'Android Device',
          publicKey:      null,
          connectionType: 'WiFi Direct',
        };
        this._peers.set(device.deviceAddress, peer);
        this.onPeerDiscovered?.(peer);
        this._connectToPeer(device.deviceAddress);
      }
    }
  }

  async _connectToPeer(address) {
    if (!this._active) return;
    try {
      await wifi.connect(address);
    } catch (err) {
      console.warn('[WiFi] P2P connect failed:', address, err.message);
    }
  }

  _handleGroupFormed(info) {
    const ownerAddr = info.groupOwnerAddress;
    if (info.isGroupOwner) {
      // We are the group owner — act as socket server
      this._startSocketServer();
    } else {
      // We are a client — connect outbound socket to group owner
      this._openClientSocket(ownerAddr);
    }
  }

  // ─── Socket layer ─────────────────────────────────────────────────────────────
  // WebSocket is used here for broad compatibility with Expo's JS runtime.
  // In a bare RN app, react-native-tcp-socket provides lower overhead.

  _startSocketServer() {
    // react-native-tcp-socket server (optional native module).
    // Outline shown — wire up your TCP library here if using bare workflow.
    // For Expo managed workflow, WebSocket server via a node process is an option.
    console.log('[WiFi] Acting as group owner on port', WIFI_SOCKET_PORT);
  }

  _openClientSocket(address) {
    if (this._sockets.has(address)) return;
    const url = `ws://${address}:${WIFI_SOCKET_PORT}`;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      this._sockets.set(address, ws);
      // Send our identity on connect
      ws.send(JSON.stringify({ __type: 'identity', ...JSON.parse(this._myIdentityJSON ?? '{}') }));
      console.log('[WiFi] Socket open to', address);
    };

    ws.onmessage = ({ data }) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.__type === 'identity') {
          // Update peer display name from identity handshake
          if (this._peers.has(address)) {
            this._peers.get(address).name      = parsed.displayName ?? 'Unknown';
            this._peers.get(address).publicKey = parsed.publicKey   ?? null;
          }
          return;
        }
        this.onMessageReceived?.(parsed, address);
      } catch {
        console.warn('[WiFi] Bad message from', address);
      }
    };

    ws.onclose = () => {
      this._sockets.delete(address);
      // Auto-reconnect after delay if peer is still known
      if (this._peers.has(address) && this._active) {
        setTimeout(() => this._openClientSocket(address), WIFI_RECONNECT_DELAY);
      }
    };

    ws.onerror = err => {
      console.warn('[WiFi] Socket error:', address, err.message);
    };
  }

  // ─── Sending ─────────────────────────────────────────────────────────────────

  async sendToPeer(address, message) {
    const sock = this._sockets.get(address);
    if (!sock || sock.readyState !== WebSocket.OPEN) return false;
    try {
      sock.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.warn('[WiFi] Send failed:', address, err.message);
      return false;
    }
  }

  async broadcast(message) {
    const addrs   = [...this._sockets.keys()];
    const results = await Promise.allSettled(addrs.map(a => this.sendToPeer(a, message)));
    const sent    = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return { sent, total: addrs.length };
  }

  // ─── Accessors ────────────────────────────────────────────────────────────────

  getPeers() { return [...this._peers.values()]; }
  getPeerCount() { return this._peers.size; }
}
