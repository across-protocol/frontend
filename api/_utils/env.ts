const { REACT_APP_HUBPOOL_CHAINID, GAS_MARKUP } = process.env;

export const gasMarkup: {
  [chainId: string]: number;
} = GAS_MARKUP ? JSON.parse(GAS_MARKUP) : {};
// Default to no markup.
export const DEFAULT_GAS_MARKUP = 0;

// Don't permit HUB_POOL_CHAIN_ID=0
export const HUB_POOL_CHAIN_ID = Number(REACT_APP_HUBPOOL_CHAINID || 1) as
  | 1
  | 11155111;

// Tokens that should be disabled in the routes
export const DISABLED_ROUTE_TOKENS = (
  process.env.DISABLED_ROUTE_TOKENS || ""
).split(",");

// This is an array of chainIds that should be disabled. This array overrides
// the ENABLED_ROUTES object below. This is useful for disabling a chainId
// temporarily without having to redeploy the app or change core config
// data (e.g. the ENABLED_ROUTES object and the data/routes.json files).
export const DISABLED_CHAINS = (
  process.env.REACT_APP_DISABLED_CHAINS || ""
).split(",");

// This is an array of chainIds that should be disabled. In contrast to the
// above constant `DISABLED_CHAINS`, this constant is used to disable chains
// only for the `/available-routes` endpoint and DOES NOT affect the
// `ENABLED_ROUTES` object.
export const DISABLED_CHAINS_FOR_AVAILABLE_ROUTES = (
  process.env.REACT_APP_DISABLED_CHAINS_FOR_AVAILABLE_ROUTES || ""
).split(",");

export const DISABLED_TOKENS_FOR_AVAILABLE_ROUTES = (
  process.env.REACT_APP_DISABLED_TOKENS_FOR_AVAILABLE_ROUTES || ""
).split(",");
