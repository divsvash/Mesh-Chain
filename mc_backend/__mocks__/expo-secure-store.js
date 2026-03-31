// __mocks__/expo-secure-store.js
// In-memory store so identity tests work without a real device.
const _store = {};
module.exports = {
  setItemAsync: jest.fn(async (key, value) => { _store[key] = value; }),
  getItemAsync: jest.fn(async (key)         => _store[key] ?? null),
  deleteItemAsync: jest.fn(async (key)      => { delete _store[key]; }),
  _reset: () => Object.keys(_store).forEach(k => delete _store[k]),
};
