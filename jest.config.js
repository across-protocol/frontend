/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: "[<rootDir>/node_modules/]",
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!@web3-onboard/react)"],
  transform: {
    "node_modules/(@web3-onboard/react)/.+\\.(j|t)sx?$": "ts-jest",
    "^.+\\.js$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/src/mocks/file_mock.js",
    "\\.(css|less)$": "<rootDir>/src/mocks/style_mock.js",
  },
};
