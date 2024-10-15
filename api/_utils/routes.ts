import enabledMainnetRoutesAsJson from "../../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import enabledSepoliaRoutesAsJson from "../../src/data/routes_11155111_0x14224e63716afAcE30C9a417E0542281869f7d9e.json";

import {
  HUB_POOL_CHAIN_ID,
  DISABLED_CHAINS,
  DISABLED_ROUTE_TOKENS,
} from "./env";

const _ENABLED_ROUTES =
  HUB_POOL_CHAIN_ID === 1
    ? enabledMainnetRoutesAsJson
    : enabledSepoliaRoutesAsJson;

_ENABLED_ROUTES.routes = _ENABLED_ROUTES.routes.filter(
  ({ fromChain, toChain, fromTokenSymbol }) =>
    ![fromChain, toChain].some((chainId) =>
      DISABLED_CHAINS.includes(chainId.toString())
    ) && !DISABLED_ROUTE_TOKENS.includes(fromTokenSymbol)
);

export const ENABLED_ROUTES = _ENABLED_ROUTES;
