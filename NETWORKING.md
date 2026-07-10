# Networking

## Overview

MeshChain operates without centralized infrastructure.

Devices communicate directly with neighboring peers using short-range wireless transports.

Each node functions as both:

- endpoint
- relay

creating a decentralized mesh.

---

# Network Topology

```
A

↓

B

↓

C

↓

D
```

Device B forwards packets.

Device C forwards packets.

Communication continues beyond direct radio range.

---

# Peer Discovery

Peers are discovered using:

- Bluetooth Low Energy
- WiFi Direct

Discovery occurs continuously while the application is active.

---

# Message Propagation

When a device creates a message:

```
Create

↓

Sign

↓

Hash

↓

Persist

↓

Broadcast

↓

Neighbor

↓

Verify

↓

Store

↓

Relay
```

Each node repeats this process until propagation completes.

---

# Relay Logic

Each node follows the same algorithm.

```
Receive Message

↓

Seen Before?

├── Yes → Drop

└── No

↓

Verify

↓

Persist

↓

Relay
```

This prevents infinite forwarding loops.

---

# TTL (Time To Live)

Messages include a hop counter.

Each relay decrements the remaining TTL.

When TTL reaches zero:

Message propagation stops.

TTL limits:

- battery usage
- network congestion
- infinite relay loops

---

# Store-and-Forward

If no peer is available:

```
Create

↓

SQLite Queue

↓

Wait

↓

Peer Appears

↓

Transmit
```

This improves reliability during intermittent connectivity.

---

# Deduplication

Each message contains a unique identifier.

Processed IDs are cached locally.

Duplicate packets are ignored.

Benefits:

- prevents relay storms
- reduces bandwidth
- reduces battery usage

---

# Eventual Consistency

Nodes may temporarily disagree.

Given sufficient connectivity:

All reachable nodes converge toward the same message history.

This favors resilience over immediate consistency.

---

# Current Routing

Current implementation uses broadcast relay.

Advantages:

- simple
- robust
- decentralized

Future improvements:

- adaptive routing
- shortest-path relay
- signal-aware routing
- battery-aware forwarding
- congestion control

---

# Engineering Tradeoffs

| Decision | Benefit | Cost |
|------------|----------|------|
| Flood relay | Simplicity | More transmissions |
| Local persistence | Reliable delivery | Storage usage |
| TTL | Prevents loops | Reduced propagation distance |
| BLE | Low power | Lower throughput |
| WiFi Direct | Faster | Higher energy consumption |