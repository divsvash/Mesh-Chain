// __mocks__/react-native-get-random-values.js
// Polyfills crypto.getRandomValues for the Jest (Node) environment.
const { webcrypto } = require('crypto');
global.crypto = webcrypto;
