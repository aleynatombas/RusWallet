const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// react-async-hook'u nested location'dan çözümle
config.resolver.extraNodeModules = {
  'react-async-hook': path.resolve(__dirname, 'node_modules/react-async-hook'),
};

// Nested react-native-country-picker-modal'ın dev bağımlılıklarını tara dışı bırak
const nestedBase = path.resolve(
  __dirname,
  'node_modules/react-native-phone-number-input/node_modules/react-native-country-picker-modal/node_modules'
);
config.resolver.blockList = [
  new RegExp(`${nestedBase.replace(/\\/g, '\\\\')}[\\\\/](?!react-async-hook).*`),
];

module.exports = config;
