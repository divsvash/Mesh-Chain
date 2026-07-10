// __mocks__/react-native-wifi-p2p.js
module.exports = {
  initialize:             jest.fn(() => Promise.resolve()),
  startDiscoveringPeers:  jest.fn(() => Promise.resolve()),
  stopDiscoveringPeers:   jest.fn(() => Promise.resolve()),
  connect:                jest.fn(() => Promise.resolve()),
  disconnect:             jest.fn(() => Promise.resolve()),
  subscribeOnPeersUpdates:      jest.fn(() => jest.fn()),
  subscribeOnConnectionInfoUpdates: jest.fn(() => jest.fn()),
};
