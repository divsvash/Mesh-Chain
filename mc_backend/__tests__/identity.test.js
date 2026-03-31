// __tests__/identity.test.js
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => {}),
  getItemAsync: jest.fn(async (key) => {
    const store = global.__secureStore__ || {};
    return store[key] ?? null;
  }),
}));

import * as SecureStore from 'expo-secure-store';
import { signPayload, verifyPayload, Identity } from '../src/identity/identity';
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

// Build a real keypair for tests
const kp = nacl.sign.keyPair();
const PUB = encodeBase64(kp.publicKey);
const PRV = encodeBase64(kp.secretKey);

describe('signPayload / verifyPayload', () => {
  const payload = { id: 'msg1', content: 'Hello mesh', timestamp: 1234567890 };

  it('produces a non-null signature string', () => {
    const sig = signPayload(payload, PRV);
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  it('verifies a valid signature', () => {
    const sig = signPayload(payload, PRV);
    expect(verifyPayload(payload, sig, PUB)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const sig = signPayload(payload, PRV);
    const tampered = { ...payload, content: 'HACKED' };
    expect(verifyPayload(tampered, sig, PUB)).toBe(false);
  });

  it('rejects a wrong public key', () => {
    const sig  = signPayload(payload, PRV);
    const kp2  = nacl.sign.keyPair();
    const pub2 = encodeBase64(kp2.publicKey);
    expect(verifyPayload(payload, sig, pub2)).toBe(false);
  });

  it('rejects garbage signature', () => {
    expect(verifyPayload(payload, 'notavalidsig', PUB)).toBe(false);
  });

  it('returns false on bad base64 public key', () => {
    const sig = signPayload(payload, PRV);
    expect(verifyPayload(payload, sig, 'not-base64!!!')).toBe(false);
  });
});

describe('Identity class', () => {
  it('shortId is 8 uppercase chars from public key', () => {
    const id = new Identity({ publicKey: PUB, privateKey: PRV, displayName: 'Alice' });
    expect(id.shortId).toBe(PUB.slice(0, 8).toUpperCase());
  });

  it('sign() produces a verifiable signature', () => {
    const id      = new Identity({ publicKey: PUB, privateKey: PRV, displayName: 'Alice' });
    const payload = { id: 'x', content: 'test', timestamp: 0 };
    const sig     = id.sign(payload);
    expect(Identity.verify(payload, sig, PUB)).toBe(true);
  });

  it('toJSON() returns publicKey and displayName', () => {
    const id  = new Identity({ publicKey: PUB, privateKey: PRV, displayName: 'Bob' });
    const obj = id.toJSON();
    expect(obj.publicKey).toBe(PUB);
    expect(obj.displayName).toBe('Bob');
    expect(obj.privateKey).toBeUndefined(); // never expose private key in JSON
  });
});
