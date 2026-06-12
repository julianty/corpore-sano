const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve modules from the parent src/ directory
config.watchFolders = [path.resolve(__dirname, "../src")];
// Mobile node_modules first so RN deps keep resolving locally; root second so
// firebase (root-only, shared with the web app) resolves to a single SDK copy.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../node_modules"),
];
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
