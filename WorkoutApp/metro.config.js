const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    alias: {
      'nanoid/non-secure': path.resolve(__dirname, 'node_modules/nanoid/non-secure'),
    },
    assetExts: [...defaultConfig.resolver.assetExts, 'png', 'jpg', 'jpeg', 'glb', 'csv'],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json', 'svg'],
  },
};
