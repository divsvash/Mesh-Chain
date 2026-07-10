# MeshChain Architecture

## Overview

MeshChain is an offline-first distributed communication platform designed for environments where internet infrastructure is unavailable or unreliable.

Unlike conventional messaging systems that depend on centralized servers, MeshChain enables nearby devices to exchange authenticated messages directly over short-range wireless transports while maintaining message integrity and local persistence.

The system follows a modular architecture that separates networking, identity, persistence, verification, and application logic.

---

# High-Level Architecture

```
                        MeshChain

                ┌────────────────────┐
                │ React Native Client│
                └─────────┬──────────┘
                          │
                   Application Hooks
                          │
                  MeshController Layer
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
 Bluetooth Manager   WiFi Direct Manager   Local APIs
        │                 │
        └─────────────────┴─────────────────┘
                          │
                  Message Relay Engine
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   Identity Manager   Verification   Storage Manager
         │                │                │
 Public/Private Keys   SHA-256 Hash   SQLite Database
```

---

# Architectural Principles

MeshChain is designed around the following engineering principles:

### Offline-first

All user actions complete locally without requiring network availability.

Network synchronization occurs opportunistically whenever neighboring peers become reachable.

---

### Local-first Persistence

Messages are persisted before transmission.

This guarantees that user actions succeed immediately even if delivery must occur later.

---

### Separation of Concerns

Each subsystem owns a single responsibility.

| Component | Responsibility |
|------------|----------------|
| MeshController | Coordinates application workflow |
| BleMeshManager | BLE discovery and communication |
| WifiMeshManager | WiFi Direct transport |
| Identity | Cryptographic identities |
| Blockchain / Verification | Integrity validation |
| Storage | Persistence and relay queue |

---

### Eventual Consistency

Since no central authority exists, all devices converge toward a consistent state through message propagation and deduplication.

Immediate consistency is intentionally sacrificed to maximize resilience.

---

# Component Responsibilities

## MeshController

Acts as the orchestration layer.

Responsibilities include:

- transport selection
- relay coordination
- synchronization
- message lifecycle management

---

## BLE Manager

Responsible for

- peer discovery
- connection management
- packet transmission
- low-energy communication

---

## WiFi Direct Manager

Responsible for

- higher bandwidth transport
- peer negotiation
- large message exchange

---

## Identity Manager

Generates device identity.

Provides:

- keypair generation
- digital signatures
- signature verification

---

## Storage Manager

Responsible for

- SQLite persistence
- relay queue
- pending delivery
- message history

---

# Message Flow

```
Compose Message

↓

Sign Message

↓

Hash Message

↓

Persist Locally

↓

Transmit

↓

Receiving Peer

↓

Verify Signature

↓

Verify SHA-256

↓

Deduplicate

↓

Persist

↓

Relay
```

---

# Scalability Considerations

Current architecture prioritizes:

- reliability
- modularity
- maintainability

Potential improvements include:

- adaptive routing
- relay prioritization
- compression
- routing metrics
- energy-aware propagation

---

# Future Evolution

Future versions may include:

- hybrid online/offline synchronization
- efficient routing algorithms
- encrypted group communication
- relay reputation
- adaptive transport selection