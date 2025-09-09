/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */

module.exports = {
  setupFiles: ["<rootDir>/setup.jest.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.svg$": "jest-transform-stub",
    "^.+\\.png$": "jest-transform-stub",
  },
  testMatch: [
    "<rootDir>/test/api/**/*.test.{ts,tsx}",
    "<rootDir>/e2e-api/**/*.test.{ts,tsx}",
  ],
  moduleNameMapper: {
    // Only keep uuid mapping for API tests - remove frontend path mappings
    uuid: require.resolve("uuid"),
  },
};
