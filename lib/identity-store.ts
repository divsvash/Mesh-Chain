// lib/identity-store.ts
// Web-side identity manager.
// Generates Ed25519 keypair on first run, persists in localStorage.
// Mirrors mc_backend/src/identity/identity.js for the web frontend.

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8 } from 'tweetnacl-util';

const KEYS = {
  publicKey:   'mc_public_key',
  privateKey:  'mc_private_key',
  displayName: 'mc_display_name',
  created:     'mc_created_at',
};

export interface Identity {
  publicKey:   string;  // base64 Ed25519 public key
  privateKey:  string;  // base64 Ed25519 private key
  displayName: string;
  shortId:     string;  // first 8 chars of public key — used as display ID
  createdAt:   number;
}

// Returns null if no identity exists yet
export function loadIdentity(): Identity | null {
  if (typeof window === 'undefined') return null;
  const pub  = localStorage.getItem(KEYS.publicKey);
  const prv  = localStorage.getItem(KEYS.privateKey);
  const name = localStorage.getItem(KEYS.displayName);
  const created = localStorage.getItem(KEYS.created);
  if (!pub || !prv || !name) return null;
  return {
    publicKey:   pub,
    privateKey:  prv,
    displayName: name,
    shortId:     pub.slice(0, 8).toUpperCase(),
    createdAt:   Number(created) || Date.now(),
  };
}

// Creates a new identity with the given display name
export function createIdentity(displayName: string): Identity {
  const keypair   = nacl.sign.keyPair();
  const publicKey = encodeBase64(keypair.publicKey);
  const privateKey= encodeBase64(keypair.secretKey);
  const createdAt = Date.now();

  localStorage.setItem(KEYS.publicKey,   publicKey);
  localStorage.setItem(KEYS.privateKey,  privateKey);
  localStorage.setItem(KEYS.displayName, displayName.trim().slice(0, 30));
  localStorage.setItem(KEYS.created,     String(createdAt));

  return {
    publicKey,
    privateKey,
    displayName: displayName.trim().slice(0, 30),
    shortId:     publicKey.slice(0, 8).toUpperCase(),
    createdAt,
  };
}

export function updateDisplayName(name: string): void {
  localStorage.setItem(KEYS.displayName, name.trim().slice(0, 30));
}

export function clearIdentity(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

// ─── Extended profile ─────────────────────────────────────────────────────────

export interface ExtendedProfile {
  location:               string;
  emergencyContactName:   string;
  emergencyContactNumber: string;
  skills:                 string[];
}

const PROFILE_KEY = 'mc_extended_profile';

export function loadExtendedProfile(): ExtendedProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

export function saveExtendedProfile(profile: ExtendedProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearExtendedProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}
// Sign a payload with the private key
export function signPayload(payload: object, privateKeyB64: string): string | null {
  try {
    const privateKey = decodeBase64(privateKeyB64);
    const message    = new TextEncoder().encode(JSON.stringify(payload));
    const sig        = nacl.sign.detached(message, privateKey);
    return encodeBase64(sig);
  } catch {
    return null;
  }
}