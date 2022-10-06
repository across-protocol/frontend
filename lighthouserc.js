const URL_PATHS = ["/", "/airdrop", "/pool", "/rewards", "/transactions"];
const BASE_URL = process.env.PUBLIC_URL;

module.exports = {
  ci: {
    collect: {
      url: URL_PATHS.map((path) => `${BASE_URL}${path}`),
      numberOfRuns: 2,
    },
    upload: {
      target: "temporary-public-storage",
    },
    assert: {
      preset: "lighthouse:recommended",
    },
  },
};
