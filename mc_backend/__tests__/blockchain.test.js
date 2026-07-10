// __tests__/blockchain.test.js
import {
  computeHash,
  createGenesisBlock,
  createBlock,
  isBlockValid,
  isChainValid,
  verifyStandaloneBlock,
  BlockchainManager,
} from '../src/blockchain/blockchain';

jest.mock('../src/constants', () => ({
  GENESIS_PREV_HASH: '0'.repeat(64),
}));

describe('computeHash', () => {
  it('returns a 64-char hex string', () => {
    const h = computeHash(0, 1700000000000, { x: 1 }, '0'.repeat(64), 0);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    const a = computeHash(1, 123, { msg: 'hi' }, 'abc', 0);
    const b = computeHash(1, 123, { msg: 'hi' }, 'abc', 0);
    expect(a).toBe(b);
  });

  it('changes when any field changes', () => {
    const base = computeHash(1, 123, { msg: 'hi' }, 'abc', 0);
    expect(computeHash(2, 123, { msg: 'hi' }, 'abc', 0)).not.toBe(base);
    expect(computeHash(1, 999, { msg: 'hi' }, 'abc', 0)).not.toBe(base);
    expect(computeHash(1, 123, { msg: 'changed' }, 'abc', 0)).not.toBe(base);
  });
});

describe('createGenesisBlock', () => {
  it('has index 0 and all-zero prevHash', () => {
    const g = createGenesisBlock();
    expect(g.index).toBe(0);
    expect(g.prevHash).toBe('0'.repeat(64));
    expect(g.hash).toHaveLength(64);
  });

  it('produces identical blocks on repeated calls (deterministic timestamp)', () => {
    const g1 = createGenesisBlock();
    const g2 = createGenesisBlock();
    expect(g1.hash).toBe(g2.hash);
  });
});

describe('createBlock', () => {
  it('links to previous block via prevHash', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'x' });
    expect(b.prevHash).toBe(g.hash);
    expect(b.index).toBe(1);
  });

  it('hash reflects the data', () => {
    const g  = createGenesisBlock();
    const b1 = createBlock(g, { id: 'a' });
    const b2 = createBlock(g, { id: 'b' });
    expect(b1.hash).not.toBe(b2.hash);
  });
});

describe('isBlockValid', () => {
  it('validates a correctly formed chain link', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'test' });
    expect(isBlockValid(b, g)).toBe(true);
  });

  it('rejects tampered hash', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'test' });
    expect(isBlockValid({ ...b, hash: 'f'.repeat(64) }, g)).toBe(false);
  });

  it('rejects tampered data', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'original' });
    expect(isBlockValid({ ...b, data: { id: 'hacked' } }, g)).toBe(false);
  });

  it('rejects wrong index', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'test' });
    expect(isBlockValid({ ...b, index: 99 }, g)).toBe(false);
  });

  it('rejects broken prevHash', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'test' });
    expect(isBlockValid({ ...b, prevHash: 'wrong' }, g)).toBe(false);
  });

  it('returns false for null inputs', () => {
    expect(isBlockValid(null, null)).toBe(false);
    expect(isBlockValid({}, null)).toBe(false);
  });
});

describe('isChainValid', () => {
  it('validates a multi-block chain', () => {
    const chain = [createGenesisBlock()];
    chain.push(createBlock(chain[0], { id: 'a' }));
    chain.push(createBlock(chain[1], { id: 'b' }));
    expect(isChainValid(chain)).toBe(true);
  });

  it('rejects a chain with tampered middle block', () => {
    const chain = [createGenesisBlock()];
    chain.push(createBlock(chain[0], { id: 'a' }));
    chain.push(createBlock(chain[1], { id: 'b' }));
    chain[1] = { ...chain[1], data: { id: 'HACKED' } };
    expect(isChainValid(chain)).toBe(false);
  });

  it('returns false for empty or null input', () => {
    expect(isChainValid([])).toBe(false);
    expect(isChainValid(null)).toBe(false);
  });
});

describe('verifyStandaloneBlock', () => {
  it('verifies an unmodified block', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'msg' });
    expect(verifyStandaloneBlock(b)).toBe(true);
  });

  it('rejects a data-tampered block', () => {
    const g = createGenesisBlock();
    const b = createBlock(g, { id: 'msg', content: 'original' });
    expect(verifyStandaloneBlock({ ...b, data: { id: 'msg', content: 'TAMPERED' } })).toBe(false);
  });

  it('returns false for null or missing hash', () => {
    expect(verifyStandaloneBlock(null)).toBe(false);
    expect(verifyStandaloneBlock({})).toBe(false);
  });
});

describe('BlockchainManager', () => {
  let mgr;
  beforeEach(() => { mgr = new BlockchainManager(); });

  it('initializes with a valid genesis block', () => {
    expect(mgr.getLength()).toBe(1);
    expect(mgr.isValid()).toBe(true);
  });

  it('addMessage grows the chain and returns a block', () => {
    const block = mgr.addMessage({ id: 'msg1', type: 'chat', senderId: 'alice', timestamp: Date.now() });
    expect(mgr.getLength()).toBe(2);
    expect(block.hash).toHaveLength(64);
    expect(mgr.isValid()).toBe(true);
  });

  it('verifyMessage returns true for an unmodified block', () => {
    const block = mgr.addMessage({ id: 'x', type: 'chat', senderId: 'bob', timestamp: Date.now() });
    expect(mgr.verifyMessage(block)).toBe(true);
  });

  it('verifyMessage returns false for a tampered block', () => {
    const block = mgr.addMessage({ id: 'x', type: 'chat', senderId: 'bob', timestamp: Date.now() });
    expect(mgr.verifyMessage({ ...block, data: { id: 'x', type: 'sos' } })).toBe(false);
  });

  it('export/importIfValid round-trips a longer chain', () => {
    mgr.addMessage({ id: 'a', type: 'chat', senderId: 's', timestamp: 1 });
    mgr.addMessage({ id: 'b', type: 'chat', senderId: 's', timestamp: 2 });
    const json = mgr.export();

    const mgr2 = new BlockchainManager();
    expect(mgr2.importIfValid(json)).toBe(true);
    expect(mgr2.getLength()).toBe(mgr.getLength());
  });

  it('importIfValid rejects a shorter incoming chain', () => {
    mgr.addMessage({ id: 'a', type: 'chat', senderId: 's', timestamp: 1 });
    const shortChain = new BlockchainManager();
    expect(mgr.importIfValid(shortChain.export())).toBe(false);
  });

  it('importIfValid rejects tampered JSON', () => {
    expect(mgr.importIfValid('not-json')).toBe(false);
    expect(mgr.importIfValid(null)).toBe(false);
  });
});
