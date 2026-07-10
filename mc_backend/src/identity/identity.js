// src/identity/identity.js
// Every user gets a permanent Ed25519 keypair generated on first launch.
// Private key lives in the OS secure enclave (expo-secure-store).
// Messages are signed before sending; signatures verified on receipt.

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import {
  SECURE_STORE_PRIVATE_KEY,
  SECURE_STORE_PUBLIC_KEY,
  SECURE_STORE_DISPLAY_NAME,
} from '../constants';

// ─── Key management ───────────────────────────────────────────────────────────

export async function generateKeypair() {
  const kp = nacl.sign.keyPair();
  const pub = encodeBase64(kp.publicKey);
  const prv = encodeBase64(kp.secretKey);
  await SecureStore.setItemAsync(SECURE_STORE_PUBLIC_KEY, pub);
  await SecureStore.setItemAsync(SECURE_STORE_PRIVATE_KEY, prv);
  return { publicKey: pub, privateKey: prv };
}

export async function loadKeypair() {
  const [pub, prv] = await Promise.all([
    SecureStore.getItemAsync(SECURE_STORE_PUBLIC_KEY),
    SecureStore.getItemAsync(SECURE_STORE_PRIVATE_KEY),
  ]);
  if (!pub || !prv) return null;
  return { publicKey: pub, privateKey: prv };
}

export async function getOrCreateKeypair() {
  return (await loadKeypair()) ?? (await generateKeypair());
}

export async function saveDisplayName(name) {
  await SecureStore.setItemAsync(SECURE_STORE_DISPLAY_NAME, name.trim().slice(0, 30));
}

export async function getDisplayName() {
  return (await SecureStore.getItemAsync(SECURE_STORE_DISPLAY_NAME)) ?? 'Anonymous';
}

// ─── Signing & verification ───────────────────────────────────────────────────

// Signs the core payload object (before blockHash is attached).
// Returns a base64 detached signature string.
export function signPayload(payload, privateKeyB64) {
  try {
    const privateKey = decodeBase64(privateKeyB64);
    const message    = encodeUTF8(JSON.stringify(payload));
    const sig        = nacl.sign.detached(message, privateKey);
    return encodeBase64(sig);
  } catch (err) {
    console.error('[Identity] Sign failed:', err.message);
    return null;
  }
}

// Returns true if the signature is valid for the given payload + public key.
export function verifyPayload(payload, signatureB64, publicKeyB64) {
  try {
    const publicKey  = decodeBase64(publicKeyB64);
    const signature  = decodeBase64(signatureB64);
    const message    = encodeUTF8(JSON.stringify(payload));
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

// ─── Identity class ───────────────────────────────────────────────────────────

export class Identity {
  constructor({ publicKey, privateKey, displayName }) {
    this.publicKey   = publicKey;
    this.privateKey  = privateKey;
    this.displayName = displayName ?? 'Anonymous';
  }

  // First 8 chars of public key — used as a short display ID in the UI
  get shortId() {
    return this.publicKey.slice(0, 8).toUpperCase();
  }

  // Signs the payload and returns the base64 signature
  sign(payload) {
    return signPayload(payload, this.privateKey);
  }

  // Static helper so any module can verify without instantiating Identity
  static verify(payload, signatureB64, publicKeyB64) {
    return verifyPayload(payload, signatureB64, publicKeyB64);
  }

  // Load from secure storage (or generate on first run)
  static async load() {
    const [keypair, displayName] = await Promise.all([
      getOrCreateKeypair(),
      getDisplayName(),
    ]);
    return new Identity({ ...keypair, displayName });
  }

  // Persist a new display name
  async updateDisplayName(name) {
    await saveDisplayName(name);
    this.displayName = name.trim().slice(0, 30);
  }

  // Serialized form sent to peers so they know our display name + public key
  toJSON() {
    return { publicKey: this.publicKey, displayName: this.displayName };
  }
}
