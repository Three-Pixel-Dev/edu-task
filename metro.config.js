// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// tools/ holds the admin-only Firestore seed script (firebase-admin). It must
// never be watched or bundled into the mobile app.
const toolsDir = path.resolve(__dirname, 'tools').replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  new RegExp(`^${toolsDir}[/\\\\].*`),
];

module.exports = config;
