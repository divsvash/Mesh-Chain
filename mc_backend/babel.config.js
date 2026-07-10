// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Needed for uuid in React Native
      ['@babel/plugin-transform-runtime', { helpers: true }],
    ],
  };
};
