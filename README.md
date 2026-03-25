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
