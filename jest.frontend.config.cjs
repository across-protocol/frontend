/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */

module.exports = {
  setupFiles: ["<rootDir>/setup.jest.ts"],
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.svg$": "jest-transform-stub",
    "^.+\\.png$": "jest-transform-stub",
  },
  // Only include src directory for frontend tests
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  // Exclude API modules that require Node.js dependencies
  modulePathIgnorePatterns: ["<rootDir>/api/", "<rootDir>/test/api/"],
  moduleNameMapper: {
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "^utils/(.*)$": "<rootDir>/src/utils/$1",
    "^hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^assets/(.*)$": "<rootDir>/src/assets/$1",
    "^data/(.*)$": "<rootDir>/src/data/$1",
    uuid: require.resolve("uuid"),
  },
};
