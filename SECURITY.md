# Security Model

## Overview

MeshChain assumes communication occurs in untrusted environments where packets may be intercepted, modified, replayed, or injected by malicious peers.

Rather than relying on centralized trust, security is established through cryptographic verification.

---

# Security Objectives

The system aims to provide:

- Message integrity
- Sender authentication
- Tamper detection
- Replay protection
- Decentralized trust

---

# Device Identity

Each device generates its own public/private keypair.

```
Private Key

↓

Sign Message

↓

Transmit

↓

Receiver

↓

Verify Signature

↓

Accept
```

The private key never leaves the device.

---

# Message Integrity

Every outgoing message includes:

- payload
- timestamp
- sender
- signature
- SHA-256 digest

Receiving devices recompute the digest before processing the message.

If verification fails, the message is discarded.

---

# Digital Signatures

Signatures provide:

✓ Authentication

✓ Non-repudiation

✓ Tamper detection

without requiring centralized servers.

---

# Threat Model

MeshChain considers the following threats.

## Packet Modification

Mitigation:

SHA-256 verification.

---

## Sender Impersonation

Mitigation:

Public/private key signatures.

---

## Replay Attacks

Mitigation:

Message IDs and timestamps.

Previously processed messages are rejected.

---

## Duplicate Flooding

Mitigation:

Deduplication cache.

---

## Rogue Nodes

Nodes cannot forge authenticated messages without possession of the sender's private key.

---

# Current Limitations

Current implementation does not protect against:

- Physical device compromise
- Key theft
- Traffic analysis
- Denial-of-Service attacks
- Large-scale Sybil attacks

These remain future work.

---

# Future Security Enhancements

- End-to-end encryption
- Forward secrecy
- Secure key exchange
- Revocation lists
- Anonymous identities
- Encrypted group messaging