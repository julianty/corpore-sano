const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// watchFolders: shared business logic lives in the root src/ (outside the
// mobile/ tree), reachable via the @shared alias.
config.watchFolders = [path.resolve(__dirname, "../src")];
// This is an npm workspace: shared deps (react, react-native, firebase, ...)
// hoist to the root node_modules as a single copy. nodeModulesPaths lists
// mobile's node_modules first (for the few non-hoisted nested deps) then the
// hoisted root node_modules. Versions are kept aligned across both
// package.json files so nothing splits into a second instance — see CLAUDE.md.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
