// __mocks__/expo-location.js
const Accuracy = { Balanced: 3, High: 4, Low: 1 };

module.exports = {
  Accuracy,
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 28.6139, longitude: 77.2090, accuracy: 20 },
  })),
};
