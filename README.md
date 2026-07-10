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
# 🚀 MeshChain – Offline Decentralized Communication Network

## 📌 Overview
MeshChain is a decentralized, offline communication system that enables devices to connect and exchange messages **without relying on the internet**. It uses peer-to-peer connectivity and mesh networking to ensure communication even in **disasters, rural areas, or network outages**.

---

## 🧠 Problem Statement
In critical situations such as natural disasters or remote regions, internet infrastructure often fails, making communication impossible. Existing apps depend entirely on centralized networks, leading to:
- Communication breakdown during emergencies  
- Delayed rescue operations  
- Isolation of affected communities  

---

## 💡 Solution
MeshChain creates a **self-sustaining communication network** where:
- Devices connect directly using Bluetooth/WiFi  
- Messages are relayed across devices (mesh network)  
- Data is verified using cryptographic hashing  

👉 No internet. No servers. Fully decentralized.

---

## ⚙️ Features

### 🔗 Core Features
- 📡 **Offline Messaging** – Send messages without internet  
- 🔁 **Multi-hop Relay** – Messages travel device-to-device  
- 🚨 **Emergency Broadcast** – One-tap SOS to all nearby users  
- ✅ **Message Verification** – Ensures data integrity using hashing  

### 🔥 Advanced Features
- 📦 **Store & Forward** – Deliver messages when devices reconnect  
- 🔐 **Secure Identity** – Public/private key-based authentication  
- 🧑‍🤝‍🧑 **Community Channels** – Local group communication  
- 🔋 **Smart Routing** – Efficient message forwarding  

---

## 🏗️ Tech Stack

### 📱 Frontend
- React Native (Expo)

### 📡 Communication
- Bluetooth Low Energy (BLE)  
- WiFi Direct  

### 🧠 Core Logic
- Mesh Networking  
- Delay-Tolerant Networking  

### 🔐 Security
- SHA-256 Hashing  
- Public/Private Key Cryptography  

### 💾 Storage
- Local storage (AsyncStorage / SQLite)

---

## 🔄 How It Works

1. Devices discover nearby users via Bluetooth/WiFi  
2. A message is sent from one device to another  
3. Each device acts as a relay node  
4. Messages propagate across the network (multi-hop)  
5. Each message is hashed and verified  
6. Only authentic messages are displayed  

---

## 🧪 Demo Flow

1. Turn off internet on all devices  
2. Connect devices via Bluetooth/WiFi  
3. Send message from Device A  
4. Message reaches Device C via Device B  
5. Trigger Emergency SOS broadcast  
6. Verify message authenticity  

---

## 🌍 Use Cases

- 🚨 Disaster communication (earthquakes, floods)  
- 🌾 Rural areas with no internet access  
- 🎪 Large gatherings and events  
- 🪖 Emergency and defense scenarios  

---

## 🚀 Future Scope

- 📍 Offline location sharing  
- 🧠 AI-based spam detection & alert summarization  
- 🌐 Integration with IPFS for hybrid connectivity  
- 🔗 Full blockchain integration for global syncing  

---

## 🤝 Contribution
This project is built as part of a hackathon. Contributions, ideas, and improvements are welcome!

---

## 📄 License
MIT License

---

## 💬 Tagline
> “A communication network that works even when the internet doesn’t.”
>>>>>>> 7638c00d1a9c8cba23483622f90c2ae1b1fe28f0
