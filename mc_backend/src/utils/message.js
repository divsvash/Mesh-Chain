// src/utils/message.js
// Defines the canonical message shape used across the entire system.
// All creation goes through the factory functions here — never hand-roll messages.

import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { MESSAGE_TYPES, CHANNELS, MESSAGE_MAX_TTL, SEEN_MESSAGE_CACHE_SIZE } from '../constants';

export { MESSAGE_TYPES, CHANNELS };

// ─── Message shape ────────────────────────────────────────────────────────────
// {
//   id          : string  — UUID
//   type        : string  — MESSAGE_TYPES.*
//   channel     : string | null
//   senderId    : string  — sender's base64 public key
//   senderName  : string  — display name at send time
//   content     : string  — message body
//   location    : { lat: number, lng: number } | null
//   timestamp   : number  — unix ms
//   ttl         : number  — hops remaining (starts at MESSAGE_MAX_TTL)
//   hopCount    : number  — hops already taken
//   signature   : string | null  — base64 nacl detached signature
//   blockHash   : string | null  — added after blockchain.addMessage()
// }

// ─── Factory functions ────────────────────────────────────────────────────────

export function createMessage({ type = MESSAGE_TYPES.CHAT, channel = null, senderId, senderName, content, location = null, identity = null }) {
  const payload = {
    id:        uuidv4(),
    type,
    channel,
    senderId,
    senderName,
    content,
    location,
    timestamp: Date.now(),
    ttl:       MESSAGE_MAX_TTL,
    hopCount:  0,
    blockHash: null,
  };
  // Sign the payload before blockHash is added (blockHash is added later)
  const signature = identity ? identity.sign(payload) : null;
  return { ...payload, signature };
}

export function createSOSMessage({ senderId, senderName, location, identity }) {
  return createMessage({
    type:      MESSAGE_TYPES.SOS,
    channel:   CHANNELS.EMERGENCY,
    senderId,
    senderName,
    content:   `SOS from ${senderName}. I need help immediately.`,
    location,
    identity,
  });
}

export function createBroadcastMessage({ channel = CHANNELS.GENERAL, senderId, senderName, content, identity }) {
  return createMessage({ type: MESSAGE_TYPES.BROADCAST, channel, senderId, senderName, content, identity });
}

export function createSystemMessage(content) {
  return {
    id:        uuidv4(),
    type:      MESSAGE_TYPES.SYSTEM,
    channel:   null,
    senderId:  'system',
    senderName:'MeshChain',
    content,
    location:  null,
    timestamp: Date.now(),
    ttl:       1,
    hopCount:  0,
    signature: null,
    blockHash: null,
  };
}

// ─── Relay logic ──────────────────────────────────────────────────────────────
// Returns a new message object ready to forward, or null if TTL is exhausted.
// Never mutates the input.

export function prepareForRelay(message) {
  if (!message || message.ttl <= 1) return null;
  return {
    ...message,
    ttl:      message.ttl - 1,
    hopCount: message.hopCount + 1,
  };
}

// ─── Deduplication set ────────────────────────────────────────────────────────
// Keeps an LRU-style fixed-size set of seen message IDs.
// Prevents the same message being relayed multiple times by the same device.

export class SeenMessages {
  constructor(maxSize = SEEN_MESSAGE_CACHE_SIZE) {
    this._set    = new Set();
    this._queue  = [];
    this._max    = maxSize;
  }

  has(id) {
    return this._set.has(id);
  }

  add(id) {
    if (this._set.has(id)) return;
    this._set.add(id);
    this._queue.push(id);
    if (this._queue.length > this._max) {
      this._set.delete(this._queue.shift());
    }
  }

  clear() {
    this._set.clear();
    this._queue = [];
  }

  get size() {
    return this._set.size;
  }
}
