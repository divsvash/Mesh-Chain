// __mocks__/react-native-ble-plx.js
const State = {
  PoweredOn:  'PoweredOn',
  PoweredOff: 'PoweredOff',
  Unknown:    'Unknown',
};

class BleManager {
  state()                        { return Promise.resolve(State.PoweredOn); }
  onStateChange(cb, emit)        { if (emit) cb(State.PoweredOn); return { remove: jest.fn() }; }
  startDeviceScan()              {}
  stopDeviceScan()               {}
  destroy()                      {}
}

module.exports = { BleManager, State };
