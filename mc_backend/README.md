# MeshChain

Offline peer-to-peer communication using mesh networking + blockchain verification.
No internet required. Works over Bluetooth (BLE) and WiFi Direct.

---

## Project Structure

```
meshchain/
├── App.js                          ← Entry point (swap in your v0 screens here)
├── package.json
├── babel.config.js
│
├── src/
│   ├── mesh/
│   │   ├── BleMeshManager.js       ← BLE peer discovery + messaging
│   │   ├── WifiMeshManager.js      ← WiFi Direct peer discovery + messaging
│   │   └── MeshController.js       ← Main brain — orchestrates everything
│   │
│   ├── blockchain/
│   │   └── blockchain.js           ← Block creation, hashing, chain verification
│   │
│   ├── identity/
│   │   └── identity.js             ← Keypair generation, signing, verification
│   │
│   ├── storage/
│   │   └── StorageManager.js       ← SQLite persistence + store-and-forward queue
│   │
│   ├── utils/
│   │   └── message.js              ← Message shape, creation, relay logic
│   │
│   └── hooks/
│       └── useMesh.js              ← React hooks for the v0 frontend to import
│
└── __tests__/
    ├── blockchain.test.js
    └── message.test.js
```

---

## How to Integrate Your v0 Frontend

1. Build your UI in v0.dev using the prompt provided
2. Download the generated React/Next.js code
3. Copy the screen components into `src/screens/`
4. In each screen, import the relevant hook:

```js
// Chat screen
import { useMessages } from '../hooks/useMesh';
const { messages, sendMessage } = useMessages();

// Nearby screen
import { usePeers } from '../hooks/useMesh';
const { peers, peerCount } = usePeers();

// SOS screen
import { useSOS } from '../hooks/useMesh';
const { sosActive, triggerSOS, cancelSOS } = useSOS();

// Profile screen
import { useStats, useSettings } from '../hooks/useMesh';
const stats = useStats();
const { relayEnabled, setRelayEnabled } = useSettings();
```

5. In `App.js`, replace the placeholder with your root navigator:
```js
import { RootNavigator } from './src/screens/RootNavigator';
// ...
return <RootNavigator identity={identity} />;
```

---

## Message Verification Badge Logic

Each message has a `verified` boolean. In your v0 UI:

```js
// Show green ✅ badge if verified, red ⚠️ if not
{message.verified
  ? <Badge color="green">✅ Verified</Badge>
  : <Badge color="red">⚠️ Tampered</Badge>
}

// Show hop count
<Text>{message.hopCount} hop{message.hopCount !== 1 ? 's' : ''}</Text>
```

---

## Running

```bash
npm install
npx expo start --android    # for Android (WiFi Direct only works on Android)
npx expo start --ios        # for iOS (BLE only)
```

## Tests

```bash
npm test
```

---

## Demo Setup (Hackathon)

1. 3 Android phones
2. Turn off WiFi + mobile data on all three
3. Open MeshChain on all three
4. Send a message from Phone A
5. Watch it appear on Phone C (relayed via Phone B)
6. Trigger SOS — appears on all devices instantly
7. Show the ✅ Verified badge vs a manually tampered message

### Key phrases for your pitch:
- "This network doesn't rely on the internet at all"
- "Messages are cryptographically signed — no impersonation possible"
- "Blockchain verification means no one can alter a message in transit"
- "Store-and-forward means your message delivers even if peers connect later"
- "It's a parallel communication layer for when infrastructure fails"
