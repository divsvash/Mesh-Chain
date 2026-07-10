<<<<<<< HEAD
# MeshChain

> **Offline-First Distributed Communication Platform**

MeshChain is an offline-first communication platform that enables nearby devices to exchange authenticated messages without relying on internet connectivity or centralized infrastructure.

Designed for disaster response, rural connectivity, and emergency communication, MeshChain combines peer-to-peer networking, local-first persistence, cryptographic identity verification, and delay-tolerant messaging to maintain communication when traditional networks are unavailable.

---

## Why MeshChain?

Most communication platforms assume reliable internet connectivity.

During natural disasters, infrastructure failures, or in remote regions, this assumption breaks down, leaving communities without a reliable way to communicate.

MeshChain removes this dependency by allowing devices to communicate directly with one another over short-range wireless transports. Every device can act as both a client and a relay, extending network reach without requiring a centralized server.

---

## Design Goals

MeshChain was designed around four core principles:

- **Offline-first** — Communication should continue even when internet access is unavailable.
- **Decentralized** — Eliminate single points of failure by removing central servers.
- **Authenticated** — Every message should be verifiable and resistant to tampering.
- **Resilient** — Messages should survive intermittent connectivity through store-and-forward delivery.

---

# Architecture

```
                    MeshChain

             React Native Application
                      │
                useMesh Hooks
                      │
              MeshController
                      │
      ┌───────────────┴───────────────┐
      │                               │
 Bluetooth Low Energy         WiFi Direct
      │                               │
      └───────────────┬───────────────┘
                      │
               Message Relay Engine
                      │
        Identity & Signature Verification
                      │
          SHA-256 Integrity Validation
                      │
         SQLite Local Persistence Layer
                      │
          Store-and-Forward Delivery
```

The application separates networking, storage, identity, and messaging into independent modules, allowing each subsystem to evolve without tightly coupling business logic to transport mechanisms.

---

# Core Features

### Offline Peer-to-Peer Messaging

Devices communicate directly over Bluetooth Low Energy (BLE) and WiFi Direct without requiring internet connectivity.

---

### Multi-Hop Message Relay

Each participating device forwards unseen messages to nearby peers, extending communication beyond direct transmission range.

---

### Delay-Tolerant Networking

Messages are persisted locally and delivered opportunistically when new peers become available, improving reliability in intermittently connected environments.

---

### Cryptographic Identity

Each device generates a public/private key pair used to digitally sign outgoing messages.

Receiving devices verify signatures before accepting messages, preventing sender impersonation.

---

### Message Integrity Verification

Every transmitted message includes a SHA-256 digest.

Recipients recompute the hash before processing the message to detect tampering during relay.

---

### Emergency Broadcasts

Users can broadcast SOS messages to all reachable peers.

Emergency messages propagate across the mesh using the same relay mechanism as standard communication.

---

## Message Lifecycle

```
Compose Message
        │
        ▼
Sign using Private Key
        │
        ▼
Generate SHA-256 Hash
        │
        ▼
Persist to SQLite
        │
        ▼
Broadcast to Nearby Peers
        │
        ▼
Receiving Device
        │
 ┌──────┴────────┐
 │ Verify Hash   │
 │ Verify Signature │
 │ Check Duplicate │
 └──────┬────────┘
        │
Store Message
        │
        ▼
Relay to Next Peer
```

---

# Security Model

MeshChain uses multiple layers of verification to establish trust without requiring a centralized authority.

### Digital Signatures

Each device generates a cryptographic key pair.

Outgoing messages are digitally signed using the sender's private key.

Receiving devices verify signatures using the sender's public key before displaying or forwarding messages.

---

### SHA-256 Verification

Every message carries a SHA-256 hash.

If message contents change during transmission, verification fails and the message is rejected.

---

### Duplicate Protection

Each node maintains a cache of previously processed message IDs.

Previously seen messages are discarded to prevent relay loops and duplicate delivery.

---

## Store-and-Forward

Connectivity within a mesh network is inherently intermittent.

Instead of dropping messages when recipients are unavailable, MeshChain stores undelivered messages locally and forwards them automatically when new peers become reachable.

This approach enables communication across dynamic networks where devices frequently disconnect and reconnect.

---

# Project Structure

```
mc_backend/
│
├── mesh/
│   ├── BleMeshManager.js
│   ├── WifiMeshManager.js
│   └── MeshController.js
│
├── blockchain/
│   └── blockchain.js
│
├── identity/
│   └── identity.js
│
├── storage/
│   └── StorageManager.js
│
├── rescue/
│
├── hooks/
│
├── utils/
│
└── __tests__/
```

Each module is responsible for a single subsystem, reducing coupling and simplifying testing.

---

# Technology Stack

### Mobile

- React Native
- Expo

### Networking

- Bluetooth Low Energy (BLE)
- WiFi Direct

### Storage

- SQLite

### Security

- SHA-256
- Public/Private Key Cryptography

### Testing

- Jest

---

# Design Tradeoffs

| Decision | Benefit | Tradeoff |
|-----------|----------|----------|
| Peer-to-peer networking | No central infrastructure | Increased discovery complexity |
| Local-first persistence | Reliable offline delivery | Additional device storage |
| Store-and-forward | Higher delivery success | Eventual rather than immediate consistency |
| Digital signatures | Sender authentication | Additional computational overhead |
| SHA-256 verification | Detects message tampering | Small hashing overhead |

---

# Current Limitations

- Bluetooth bandwidth limits throughput for large payloads.
- WiFi Direct availability differs across Android device vendors.
- Long-range communication depends on intermediate relay devices.
- Mesh routing currently prioritizes reliability over routing optimization.

---

# Future Work

- Adaptive routing algorithms
- End-to-end encrypted conversations
- Offline location sharing
- Efficient relay path optimization
- Hybrid synchronization using internet gateways when available

---

# Running Locally

```bash
npm install
npx expo start
```

Run unit tests:

```bash
npm test
```

---

# Applications

- Disaster response
- Emergency communication
- Rural connectivity
- Community mesh networks
- Large public events
- Search and rescue operations

---

# Engineering Highlights

- Offline-first architecture
- Delay-Tolerant Networking (DTN)
- Peer-to-peer communication
- Modular networking stack
- Local-first persistence
- Cryptographic identity verification
- Multi-hop message propagation
- Tamper detection using SHA-256
- Store-and-forward delivery

---

## License

MIT License
=======
