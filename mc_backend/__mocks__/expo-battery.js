// __mocks__/expo-battery.js
module.exports = {
  getBatteryLevelAsync: jest.fn(async () => 0.85), // 85% by default
};
