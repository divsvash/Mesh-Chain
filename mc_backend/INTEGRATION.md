// INTEGRATION.md
// Step-by-step guide to connecting your v0 frontend to this backend.

# Connecting your v0 frontend to MeshChain

## 1. Copy your v0 files in

Put all your v0-generated screen components into:

  src/screens/
    ChatScreen.jsx
    NearbyScreen.jsx
    BroadcastScreen.jsx
    SOSScreen.jsx
    ProfileScreen.jsx
    RootNavigator.jsx   ← your bottom tab navigator

## 2. Update App.js

Uncomment the RootNavigator import:

  import { RootNavigator } from './src/screens/RootNavigator';

  // Inside AppContent(), replace the placeholder:
  return <RootNavigator />;

## 3. Wire each screen to its hook

### ChatScreen
  import { useMessages } from '../hooks/useMesh';
  import { useMeshContext } from '../context/MeshContext';

  export function ChatScreen() {
    const { identity } = useMeshContext();
    const { messages, loading, sendChat } = useMessages();

    // messages: array of { id, content, senderName, senderId, timestamp, verified, hopCount }
    // sendChat(text) — sends a message, returns promise
    // loading: true while history loads from SQLite

    // To show verified badge:
    //   message.verified === true  → green ✅
    //   message.verified === false → red ⚠️

    // To show "mine vs theirs":
    //   message.senderId === identity.publicKey → right bubble (mine)
  }

### NearbyScreen
  import { usePeers } from '../hooks/useMesh';

  export function NearbyScreen() {
    const { peers, peerCount } = usePeers();

    // peers: array of { id, name, connectionType ('BLE' | 'WiFi Direct'), publicKey }
    // peerCount: number
    // List auto-updates when peers join or leave — no polling needed
  }

### BroadcastScreen
  import { useMessages, CHANNELS } from '../hooks/useMesh';

  export function BroadcastScreen() {
    const { messages, sendBroadcast } = useMessages({ type: 'broadcast' });

    // sendBroadcast(text, channel) — channel is one of:
    //   CHANNELS.GENERAL   = 'general'
    //   CHANNELS.EMERGENCY = 'emergency'
    //   CHANNELS.VILLAGE   = 'village_updates'
    //   CHANNELS.RELIEF    = 'relief_info'
  }

### SOSScreen
  import { useSOS } from '../hooks/useMesh';

  export function SOSScreen() {
    const { sosActive, sosLog, loading, triggerSOS, cancelSOS } = useSOS();

    // triggerSOS()  — gets GPS, signs SOS, broadcasts, starts 60s auto-repeat
    // cancelSOS()   — stops the auto-repeat
    // sosActive     — boolean, true while SOS is broadcasting
    // loading       — true while first SOS send is in progress
    // sosLog        — array of { time, message, location }
    //   e.g. "SOS reached 3 peers (BLE: 2, WiFi: 1)"
  }

### ProfileScreen
  import { useStats, useSettings } from '../hooks/useMesh';
  import { useMeshContext } from '../context/MeshContext';

  export function ProfileScreen() {
    const { identity } = useMeshContext();
    const stats = useStats();
    const { relayEnabled, storeForwardEnabled, setRelayEnabled, setStoreForwardEnabled, updateDisplayName } = useSettings();

    // identity.publicKey   — full base64 public key (show truncated in UI)
    // identity.shortId     — first 8 chars uppercase (e.g. "A3BF91C2")
    // identity.displayName — user's display name

    // stats.messagesSent
    // stats.messagesRelayed
    // stats.messagesReceived
    // stats.peersConnected
    // stats.uptime         — ms since app start
    // stats.chainLength    — number of blocks in local chain
    // stats.msgCount       — total messages in DB
    // stats.queueSize      — messages waiting in store-and-forward queue

    // setRelayEnabled(true/false)       — toggle relay mode
    // setStoreForwardEnabled(true/false) — toggle store-and-forward
    // updateDisplayName('New Name')      — async, persists to secure store
  }

## 4. Verified badge component

Copy this into your component library:

  function VerifiedBadge({ verified }) {
    if (verified === null || verified === undefined) return null;
    return verified
      ? <Text style={{ color: '#22C55E', fontSize: 11 }}>✅ Verified</Text>
      : <Text style={{ color: '#EF4444', fontSize: 11 }}>⚠️ Tampered</Text>;
  }

## 5. Format helpers

  // Format uptime
  function formatUptime(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // Format timestamp
  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Truncate public key for display
  function shortKey(publicKey) {
    if (!publicKey) return '—';
    return publicKey.slice(0, 12) + '...' + publicKey.slice(-6);
  }

## 6. Run it

  npx expo start --android

That's it. The backend starts automatically when App.js mounts MeshProvider.
