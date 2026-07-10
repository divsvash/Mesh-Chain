// __tests__/message.test.js
jest.mock('react-native-get-random-values', () => {});
jest.mock('uuid', () => ({ v4: () => 'test-uuid-' + Math.random().toString(36).slice(2) }));
jest.mock('../src/constants', () => ({
  MESSAGE_MAX_TTL:         7,
  SEEN_MESSAGE_CACHE_SIZE: 500,
  MESSAGE_TYPES: { CHAT:'chat', BROADCAST:'broadcast', SOS:'sos', SYSTEM:'system', ACK:'ack' },
  CHANNELS: { GENERAL:'general', EMERGENCY:'emergency', VILLAGE:'village_updates', RELIEF:'relief_info' },
}));

import {
  createMessage,
  createSOSMessage,
  createBroadcastMessage,
  createSystemMessage,
  prepareForRelay,
  SeenMessages,
  MESSAGE_TYPES,
  CHANNELS,
} from '../src/utils/message';

const mockIdentity = {
  publicKey: 'fakePubKey==',
  sign: jest.fn(() => 'fakeSignature=='),
};

describe('createMessage', () => {
  it('creates a well-formed message', () => {
    const msg = createMessage({ senderId: 'pk1', senderName: 'Alice', content: 'Hello', identity: mockIdentity });
    expect(msg.id).toBeTruthy();
    expect(msg.type).toBe(MESSAGE_TYPES.CHAT);
    expect(msg.ttl).toBe(7);
    expect(msg.hopCount).toBe(0);
    expect(msg.blockHash).toBeNull();
    expect(msg.signature).toBe('fakeSignature==');
    expect(msg.content).toBe('Hello');
  });

  it('generates a unique ID each call', () => {
    const m1 = createMessage({ senderId: 'p', senderName: 'n', content: 'a' });
    const m2 = createMessage({ senderId: 'p', senderName: 'n', content: 'b' });
    expect(m1.id).not.toBe(m2.id);
  });

  it('defaults location to null', () => {
    const msg = createMessage({ senderId: 'p', senderName: 'n', content: 'x' });
    expect(msg.location).toBeNull();
  });

  it('includes location when provided', () => {
    const loc = { lat: 28.6, lng: 77.2 };
    const msg = createMessage({ senderId: 'p', senderName: 'n', content: 'x', location: loc });
    expect(msg.location).toEqual(loc);
  });

  it('signature is null when no identity provided', () => {
    const msg = createMessage({ senderId: 'p', senderName: 'n', content: 'x' });
    expect(msg.signature).toBeNull();
  });
});

describe('createSOSMessage', () => {
  it('sets type to SOS and channel to EMERGENCY', () => {
    const msg = createSOSMessage({ senderId: 'p', senderName: 'Bob', location: { lat: 0, lng: 0 }, identity: mockIdentity });
    expect(msg.type).toBe(MESSAGE_TYPES.SOS);
    expect(msg.channel).toBe(CHANNELS.EMERGENCY);
    expect(msg.content).toContain('Bob');
    expect(msg.content).toContain('SOS');
  });
});

describe('createBroadcastMessage', () => {
  it('sets type to BROADCAST and uses provided channel', () => {
    const msg = createBroadcastMessage({ channel: CHANNELS.VILLAGE, senderId: 'p', senderName: 'n', content: 'Water level high', identity: mockIdentity });
    expect(msg.type).toBe(MESSAGE_TYPES.BROADCAST);
    expect(msg.channel).toBe(CHANNELS.VILLAGE);
  });
});

describe('createSystemMessage', () => {
  it('creates a system message with ttl 1', () => {
    const msg = createSystemMessage('Peer joined');
    expect(msg.type).toBe(MESSAGE_TYPES.SYSTEM);
    expect(msg.ttl).toBe(1);
    expect(msg.senderId).toBe('system');
  });
});

describe('prepareForRelay', () => {
  it('decrements TTL and increments hopCount', () => {
    const msg     = createMessage({ senderId: 'p', senderName: 'n', content: 'relay' });
    const relayed = prepareForRelay(msg);
    expect(relayed.ttl).toBe(6);
    expect(relayed.hopCount).toBe(1);
  });

  it('returns null when TTL is 1', () => {
    const msg = { ...createMessage({ senderId: 'p', senderName: 'n', content: 'x' }), ttl: 1 };
    expect(prepareForRelay(msg)).toBeNull();
  });

  it('returns null when TTL is 0', () => {
    const msg = { ...createMessage({ senderId: 'p', senderName: 'n', content: 'x' }), ttl: 0 };
    expect(prepareForRelay(msg)).toBeNull();
  });

  it('returns null for null input', () => {
    expect(prepareForRelay(null)).toBeNull();
    expect(prepareForRelay(undefined)).toBeNull();
  });

  it('does not mutate the original', () => {
    const msg = createMessage({ senderId: 'p', senderName: 'n', content: 'x' });
    const orig = msg.ttl;
    prepareForRelay(msg);
    expect(msg.ttl).toBe(orig);
  });

  it('chains correctly across multiple hops', () => {
    let msg = createMessage({ senderId: 'p', senderName: 'n', content: 'x' });
    for (let i = 0; i < 6; i++) {
      msg = prepareForRelay(msg);
      expect(msg).not.toBeNull();
    }
    // 7th relay should be null (ttl started at 7, after 6 relays ttl=1, 7th returns null)
    expect(prepareForRelay(msg)).toBeNull();
  });
});

describe('SeenMessages', () => {
  it('tracks unseen IDs as false', () => {
    const s = new SeenMessages();
    expect(s.has('abc')).toBe(false);
  });

  it('tracks added IDs as true', () => {
    const s = new SeenMessages();
    s.add('abc');
    expect(s.has('abc')).toBe(true);
  });

  it('does not double-add', () => {
    const s = new SeenMessages(10);
    s.add('x');
    s.add('x');
    expect(s.size).toBe(1);
  });

  it('evicts oldest when capacity exceeded', () => {
    const s = new SeenMessages(3);
    s.add('a'); s.add('b'); s.add('c');
    s.add('d');
    expect(s.has('a')).toBe(false);
    expect(s.has('d')).toBe(true);
  });

  it('clear() empties everything', () => {
    const s = new SeenMessages();
    s.add('a'); s.add('b');
    s.clear();
    expect(s.has('a')).toBe(false);
    expect(s.size).toBe(0);
  });
});
