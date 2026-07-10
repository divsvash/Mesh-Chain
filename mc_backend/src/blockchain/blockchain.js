// src/blockchain/blockchain.js
// Lightweight local blockchain. No consensus — each device owns its own chain.
// Purpose: tamper-evidence. If a message is altered in transit, its hash
// won't match and the device will flag it as suspicious.

import CryptoJS from 'crypto-js';
import { GENESIS_PREV_HASH } from '../constants';

// ─── Core hash function ───────────────────────────────────────────────────────
// SHA256 over a deterministic string of all block fields.
// Any change to any field produces a completely different hash.

export function computeHash(index, timestamp, data, prevHash, nonce) {
  const raw = `${index}${timestamp}${JSON.stringify(data)}${prevHash}${nonce}`;
  return CryptoJS.SHA256(raw).toString(CryptoJS.enc.Hex);
}

// ─── Genesis block ────────────────────────────────────────────────────────────
// Fixed timestamp so all devices produce the same genesis block independently.

export function createGenesisBlock() {
  const index     = 0;
  const timestamp = 1700000000000;
  const data      = { type: 'genesis', app: 'MeshChain' };
  const prevHash  = GENESIS_PREV_HASH;
  const nonce     = 0;
  const hash      = computeHash(index, timestamp, data, prevHash, nonce);
  return { index, timestamp, data, prevHash, nonce, hash };
}

// ─── Block creation ───────────────────────────────────────────────────────────

export function createBlock(prevBlock, data) {
  const index     = prevBlock.index + 1;
  const timestamp = Date.now();
  const prevHash  = prevBlock.hash;
  const nonce     = 0;
  const hash      = computeHash(index, timestamp, data, prevHash, nonce);
  return { index, timestamp, data, prevHash, nonce, hash };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isBlockValid(block, prevBlock) {
  if (!block || !prevBlock) return false;
  if (block.index !== prevBlock.index + 1) return false;
  if (block.prevHash !== prevBlock.hash) return false;
  const expected = computeHash(
    block.index, block.timestamp, block.data, block.prevHash, block.nonce
  );
  return block.hash === expected;
}

export function isChainValid(chain) {
  if (!Array.isArray(chain) || chain.length === 0) return false;
  for (let i = 1; i < chain.length; i++) {
    if (!isBlockValid(chain[i], chain[i - 1])) return false;
  }
  return true;
}

// Verify a single block received over the mesh without needing the full chain.
// Recomputes the hash and compares. Sufficient for per-message verification.
export function verifyStandaloneBlock(block) {
  if (!block || typeof block.hash !== 'string') return false;
  try {
    const recomputed = computeHash(
      block.index, block.timestamp, block.data, block.prevHash, block.nonce
    );
    return recomputed === block.hash;
  } catch {
    return false;
  }
}

// ─── BlockchainManager ────────────────────────────────────────────────────────

export class BlockchainManager {
  constructor() {
    this.chain = [createGenesisBlock()];
  }

  addMessage(payload) {
    const block = createBlock(this.chain[this.chain.length - 1], {
      id:        payload.id,
      type:      payload.type,
      senderId:  payload.senderId,
      timestamp: payload.timestamp,
    });
    this.chain.push(block);
    return block;
  }

  verifyMessage(block) {
    return verifyStandaloneBlock(block);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  getLength() {
    return this.chain.length;
  }

  isValid() {
    return isChainValid(this.chain);
  }

  // Serialize for optional peer-to-peer chain sync
  export() {
    return JSON.stringify(this.chain);
  }

  // Accept a longer valid chain from a peer (longest-chain rule)
  importIfValid(jsonString) {
    try {
      const incoming = JSON.parse(jsonString);
      if (!Array.isArray(incoming)) return false;
      if (!isChainValid(incoming)) return false;
      if (incoming.length > this.chain.length) {
        this.chain = incoming;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
