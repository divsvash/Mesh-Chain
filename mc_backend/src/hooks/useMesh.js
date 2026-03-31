// src/hooks/useMesh.js
// All React hooks the v0 frontend uses to talk to MeshController.
// Import only what each screen needs — no props drilling required.

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { getMeshController } from '../mesh/MeshController';
import { CHANNELS, MESSAGE_TYPES } from '../constants';

export { CHANNELS, MESSAGE_TYPES };

// ─── useMeshController ────────────────────────────────────────────────────────
// Boot the controller once. Use at the root of your app (in App.js).
// Returns { ready, identity, error }

export function useMeshController() {
  const [ready,    setReady]    = useState(false);
  const [identity, setIdentity] = useState(null);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const ctrl = getMeshController();

    ctrl.start()
      .then(id => { setIdentity(id); setReady(true); })
      .catch(err => { console.error('[useMeshController]', err); setError(err.message); });

    // Stop the controller when the app goes to background (optional — keeps it alive if removed)
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background') {
        // keep running for mesh relay purposes
      }
    });

    return () => {
      sub.remove();
      ctrl.stop();
    };
  }, []);

  return { ready, identity, error };
}

// ─── useMessages ──────────────────────────────────────────────────────────────
// Live message feed + send helpers.
// Options: { channel, type } — pass channel to scope to a specific channel.

export function useMessages({ channel = null, type = null } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const ctrl = getMeshController();

  useEffect(() => {
    // Load history from SQLite
    ctrl.storage.getMessages({ limit: 100, channel, type })
      .then(history => { setMessages(history.reverse()); setLoading(false); })
      .catch(() => setLoading(false));

    // Subscribe to live messages
    const onMsg = msg => {
      if (channel && msg.channel !== channel) return;
      if (type    && msg.type    !== type)    return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev; // deduplicate in UI
        return [...prev, msg];
      });
    };

    ctrl.on('messageReceived', onMsg);
    return () => ctrl.off('messageReceived', onMsg);
  }, [channel, type]);

  const sendChat = useCallback(async (content) => {
    if (!content?.trim()) return null;
    return ctrl.sendChat(content.trim(), channel);
  }, [channel]);

  const sendBroadcast = useCallback(async (content, broadcastChannel = CHANNELS.GENERAL) => {
    if (!content?.trim()) return null;
    return ctrl.sendBroadcast(content.trim(), broadcastChannel);
  }, []);

  return { messages, loading, sendChat, sendBroadcast };
}

// ─── usePeers ─────────────────────────────────────────────────────────────────
// Live list of connected peers. Refreshes on every peer join/leave event.

export function usePeers() {
  const ctrl = getMeshController();
  const [peers, setPeers] = useState(() => ctrl.getPeers());

  useEffect(() => {
    const handler = updated => setPeers([...updated]);
    ctrl.on('peersChanged', handler);
    return () => ctrl.off('peersChanged', handler);
  }, []);

  return { peers, peerCount: peers.length };
}

// ─── useSOS ───────────────────────────────────────────────────────────────────
// SOS trigger, active state, and log of what happened after triggering.

export function useSOS() {
  const ctrl = getMeshController();
  const [sosActive, setSOSActive] = useState(false);
  const [sosLog,    setSOSLog]    = useState([]);
  const [loading,   setLoading]   = useState(false);

  // Sync active state from controller (in case SOS was triggered elsewhere)
  useEffect(() => {
    const id = setInterval(() => setSOSActive(ctrl.sosActive), 1000);
    return () => clearInterval(id);
  }, []);

  const triggerSOS = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ctrl.triggerSOS();
      setSOSActive(true);
      const { ble = 0, wifi = 0 } = result?.sentVia ?? {};
      const total = ble + wifi;
      setSOSLog(prev => [...prev, {
        time:    Date.now(),
        message: total > 0
          ? `SOS reached ${total} peer${total !== 1 ? 's' : ''} (BLE: ${ble}, WiFi: ${wifi})`
          : 'SOS sent — no peers in range. Will deliver when peers found.',
        location: result?.message?.location,
      }]);
    } catch (err) {
      console.error('[useSOS]', err);
      setSOSLog(prev => [...prev, { time: Date.now(), message: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSOS = useCallback(() => {
    ctrl.cancelSOS();
    setSOSActive(false);
  }, []);

  return { sosActive, sosLog, loading, triggerSOS, cancelSOS };
}

// ─── useStats ─────────────────────────────────────────────────────────────────
// Live stats for the Profile screen stats cards.

export function useStats() {
  const ctrl = getMeshController();
  const [stats, setStats] = useState(() => ctrl.getStats());

  useEffect(() => {
    // Live stats events
    const handler = updated => setStats({ ...updated });
    ctrl.on('statsChanged', handler);

    // Uptime ticker every 10s
    const ticker = setInterval(() => {
      setStats(s => ({ ...s, uptime: Date.now() - ctrl.stats.startTime }));
    }, 10_000);

    // Load full stats (includes DB counts) once on mount
    ctrl.getFullStats().then(setStats).catch(() => {});

    return () => {
      ctrl.off('statsChanged', handler);
      clearInterval(ticker);
    };
  }, []);

  return stats;
}

// ─── useSettings ──────────────────────────────────────────────────────────────
// Toggle relay and store-and-forward from the Profile screen.

export function useSettings() {
  const ctrl = getMeshController();
  const [relayEnabled,        setRelayState]    = useState(ctrl.relayEnabled);
  const [storeForwardEnabled, setStoreForward]  = useState(ctrl.storeForwardEnabled);

  const setRelayEnabled = useCallback(val => {
    ctrl.setRelayEnabled(val);
    setRelayState(val);
  }, []);

  const setStoreForwardEnabled = useCallback(val => {
    ctrl.setStoreForwardEnabled(val);
    setStoreForward(val);
  }, []);

  const updateDisplayName = useCallback(async name => {
    await ctrl.updateDisplayName(name);
  }, []);

  return {
    relayEnabled,
    storeForwardEnabled,
    setRelayEnabled,
    setStoreForwardEnabled,
    updateDisplayName,
  };
}

// ─── useVerification ──────────────────────────────────────────────────────────
// Utility hook — checks verification status of a single message.
// Returns { verified, hashOk, sigOk } — useful for the message detail view.

export function useVerification(message) {
  const [status, setStatus] = useState({ verified: null, hashOk: null, sigOk: null });
  const ctrl = getMeshController();

  useEffect(() => {
    if (!message) return;
    // Verification is synchronous but we run it in an effect to avoid blocking render
    const hashOk = message.blockHash ? /^[0-9a-f]{64}$/.test(message.blockHash) : false;
    const sigOk  = message.signature && message.senderId
      ? (() => {
          try {
            const { Identity } = require('../identity/identity');
            const payloadToVerify = {
              id: message.id, type: message.type, channel: message.channel,
              senderId: message.senderId, senderName: message.senderName,
              content: message.content, location: message.location,
              timestamp: message.timestamp, ttl: 7, hopCount: 0, blockHash: null,
            };
            return Identity.verify(payloadToVerify, message.signature, message.senderId);
          } catch { return false; }
        })()
      : false;
    setStatus({ verified: hashOk && sigOk, hashOk, sigOk });
  }, [message?.id]);

  return status;
}
