/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  // mobile/ is a workspace with its own RN toolchain; under the single
  // hoisted node_modules there's no install boundary to stop Jest from
  // crawling it, so exclude it explicitly.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/mobile/"],
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    // Prevent Jest from trying to execute Firebase/Mantine ESM packages.
    // These modules are only used as types in the code under test.
    "^firebase/(.*)$": "<rootDir>/__mocks__/firebase.cjs",
    "^@mantine/(.*)$": "<rootDir>/__mocks__/mantine.cjs",
  },
};
