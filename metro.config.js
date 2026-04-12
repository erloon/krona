const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const nodeMajor = process.versions.node.split('.')[0];
const cacheRoot = path.join(__dirname, '.expo', 'cache');

fs.mkdirSync(cacheRoot, { recursive: true });

config.fileMapCacheDirectory = cacheRoot;
config.hasteMapCacheDirectory = cacheRoot;
config.cacheVersion = [config.cacheVersion, `node-${nodeMajor}`]
  .filter(Boolean)
  .join('-');

module.exports = config;
