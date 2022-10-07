import assert from "assert";
import { ethers } from "ethers";
import { getAddress } from "./address";
import * as superstruct from "superstruct";
import { relayFeeCalculator } from "@across-protocol/sdk-v2";
import { ChainId } from "./utils.d";
// all routes should be pre imported to be able to switch based on chain id
import KovanRoutes from "data/routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5.json";
import MainnetRoutes from "data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import GoerliRoutes from "data/routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A.json";

/* Colors and Media Queries section */
export const BREAKPOINTS = {
  tabletMin: 550,
  laptopMin: 1100,
  desktopMin: 1500,
};
export const QUERIES = {
  tabletAndUp: `(min-width: ${BREAKPOINTS.tabletMin / 16}rem)`,
  laptopAndUp: `(min-width: ${BREAKPOINTS.laptopMin / 16}rem)`,
  desktopAndUp: `(min-width: ${BREAKPOINTS.desktopMin / 16}rem)`,
  tabletAndDown: `(max-width: ${(BREAKPOINTS.laptopMin - 1) / 16}rem)`,
  mobileAndDown: `(max-width: ${(BREAKPOINTS.tabletMin - 1) / 16}rem)`,
};

export const COLORS = {
  gray: {
    100: "0deg 0% 89%",
    // Hex: #F5F5F5
    150: "0deg 0% 96%",

    // #2C2F33
    160: "214.3deg 7.4% 18.6%",
    // #27292c
    175: "216deg 6% 16.3%",
    // hsl(214.3,7.4%,18.6%)
    200: "220deg 2% 72%",
    // #2c2e32
    250: "220deg 6.4% 18.4%",
    300: "240deg 4% 27%",
    // #2d2e33
    500: "230deg 6% 19%",
    // #68686c
    550: "240deg 2% 42%",
    // #4d4c53
    600: "249deg 4% 31%",
  },
  primary: {
    // #6df8d8
    500: "166deg 92% 70%",
    // #565757
    600: "180deg 0.6% 33.9%",
    700: "180deg 15% 25%",
  },
  secondary: {
    500: "266deg 77% 62%",
  },
  error: {
    500: "11deg 92% 70%",
    300: "11deg 93% 94%",
  },
  // Hex: #ffffff
  white: "0deg 100% 100%",
  black: "0deg 0% 0%",
  umaRed: "0deg 100% 65%",
  purple: "267deg 77% 62%",
};

// Update once addresses are known
export const configStoreAddresses: Record<ChainId, string> = {
  [ChainId.MAINNET]: getAddress("0x3B03509645713718B78951126E0A6de6f10043f5"),
  [ChainId.ARBITRUM]: ethers.constants.AddressZero,
  [ChainId.OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.BOBA]: ethers.constants.AddressZero,
  [ChainId.POLYGON]: ethers.constants.AddressZero,
  [ChainId.RINKEBY]: ethers.constants.AddressZero,
  [ChainId.KOVAN]: getAddress("0xDd74f7603e3fDA6435aEc91F8960a6b8b40415f3"),
  [ChainId.KOVAN_OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM_RINKEBY]: ethers.constants.AddressZero,
  [ChainId.GOERLI]: getAddress("0x3215e3C91f87081757d0c41EF0CB77738123Be83"),
  [ChainId.MUMBAI]: ethers.constants.AddressZero,
};

assert(
  process.env.REACT_APP_PUBLIC_INFURA_ID,
  "Missing process.env.REACT_APP_PUBLIC_INFURA_ID"
);
assert(
  process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY,
  "Missing process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY"
);
assert(
  process.env.REACT_APP_REWARDS_API_URL,
  "Missing process.env.REACT_APP_REWARDS_API_URL"
);
assert(
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL,
  "REACT_APP_CHAIN_137_PROVIDER_URL must be defined."
);
assert(
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL,
  "REACT_APP_CHAIN_42161_PROVIDER_URL must be defined."
);

// PROCESS.ENV variables
export const rewardsApiUrl = process.env.REACT_APP_REWARDS_API_URL;
export const mediumUrl = process.env.REACT_APP_MEDIUM_URL;
export const hubPoolChainId = Number(
  process.env.REACT_APP_HUBPOOL_CHAINID || 1
);
export const disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;
export const enableReactQueryDevTools =
  process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
export const infuraId = process.env.REACT_APP_PUBLIC_INFURA_ID;
export const confirmations =
  Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;
export const onboardApiKey = process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY;
export const matomoUrl = process.env.REACT_APP_MATOMO_URL;
export const debug = Boolean(process.env.REACT_APP_DEBUG);

export const rewardsBannerWarning =
  process.env.REACT_APP_REWARDS_BANNER_WARNING;

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
export const FEE_ESTIMATION = ".004";
export const MAX_RELAY_FEE_PERCENT = Number(
  process.env.REACT_APP_MAX_RELAY_FEE_PERCENT || 50
);
export const FLAT_RELAY_CAPITAL_FEE = process.env
  .REACT_APP_FLAT_RELAY_CAPITAL_FEE
  ? Number(process.env.REACT_APP_FLAT_RELAY_CAPITAL_FEE)
  : 0;
export const AddressZero = ethers.constants.AddressZero;
export const ArbitrumProviderUrl =
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL ||
  `https://arbitrum-mainnet.infura.io/v3/${infuraId}`;

export const PolygonProviderUrl =
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL ||
  `https://polygon-mainnet.infura.io/v3/${infuraId}`;

assert(
  isSupportedChainId(hubPoolChainId),
  "Hubpool chain is not supported: " + hubPoolChainId
);
export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}

export function getConfigStoreAddress(
  chainId: ChainId = hubPoolChainId
): string {
  const configStoreAddress = configStoreAddresses[chainId];
  assert(
    configStoreAddress !== AddressZero,
    "Config Store address not set for chain: " + chainId
  );
  return configStoreAddress;
}

const RouteSS = superstruct.object({
  fromChain: superstruct.number(),
  toChain: superstruct.number(),
  fromTokenAddress: superstruct.string(),
  fromSpokeAddress: superstruct.string(),
  fromTokenSymbol: superstruct.string(),
  isNative: superstruct.boolean(),
  l1TokenAddress: superstruct.string(),
});
const RoutesSS = superstruct.array(RouteSS);
const RouteConfigSS = superstruct.type({
  routes: RoutesSS,
  hubPoolWethAddress: superstruct.string(),
  hubPoolChain: superstruct.number(),
  hubPoolAddress: superstruct.string(),
});
export type RouteConfig = superstruct.Infer<typeof RouteConfigSS>;
export type Route = superstruct.Infer<typeof RouteSS>;
export type Routes = superstruct.Infer<typeof RoutesSS>;
export function getRoutes(chainId: ChainId): RouteConfig {
  if (chainId === ChainId.KOVAN) {
    superstruct.assert(KovanRoutes, RouteConfigSS);
    return KovanRoutes;
  }
  if (chainId === ChainId.MAINNET) {
    superstruct.assert(MainnetRoutes, RouteConfigSS);
    return MainnetRoutes;
  }
  if (chainId === ChainId.GOERLI) {
    superstruct.assert(GoerliRoutes, RouteConfigSS);
    return GoerliRoutes;
  }
  throw new Error("No routes defined for chainId: " + chainId);
}

export const routeConfig = getRoutes(hubPoolChainId);
export const hubPoolAddress = routeConfig.hubPoolAddress;
export const migrationPoolV2Warning =
  process.env.REACT_APP_MIGRATION_POOL_V2_WARNING;
export const enableMigration = process.env.REACT_APP_ENABLE_MIGRATION;
export const generalMaintenanceMessage =
  process.env.REACT_APP_GENERAL_MAINTENANCE_MESSAGE;

export const bridgeDisabled = process.env.REACT_APP_BRIDGE_DISABLED === "true";

// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9) and Arbitrum
// (0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
export const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

const getRoute = (
  mainnetChainId: ChainId,
  fromChainId: number,
  symbol: string
) => {
  const routes = getRoutes(mainnetChainId);
  const route = routes.routes.find((route) => route.fromTokenSymbol === symbol);
  if (!route)
    throw new Error(
      `Couldn't find route for mainnet chain ${mainnetChainId}, fromChain: ${fromChainId}, and symbol ${symbol}`
    );
  return route;
};

export const relayerFeeCapitalCostConfig: {
  [token: string]: relayFeeCalculator.CapitalCostConfig;
} = {
  ETH: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0006").toString(),
    cutoff: ethers.utils.parseUnits("750").toString(),
    decimals: 18,
  },
  WETH: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0006").toString(),
    cutoff: ethers.utils.parseUnits("750").toString(),
    decimals: 18,
  },
  WBTC: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0025").toString(),
    cutoff: ethers.utils.parseUnits("10").toString(),
    decimals: 8,
  },
  DAI: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.002").toString(),
    cutoff: ethers.utils.parseUnits("250000").toString(),
    decimals: 18,
  },
  USDC: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.00075").toString(),
    cutoff: ethers.utils.parseUnits("1500000").toString(),
    decimals: 6,
  },
  UMA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.00075").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
    decimals: 18,
  },
  BADGER: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
    decimals: 18,
  },
  BOBA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
    decimals: 18,
  },
};

const getQueriesTable = () => {
  const optimismUsdcRoute = getRoute(ChainId.MAINNET, ChainId.OPTIMISM, "USDC");
  const arbitrumUsdcRoute = getRoute(ChainId.MAINNET, ChainId.ARBITRUM, "USDC");

  return {
    [ChainId.MAINNET]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.ARBITRUM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.ArbitrumQueries(
        provider,
        undefined,
        arbitrumUsdcRoute.fromSpokeAddress,
        arbitrumUsdcRoute.fromTokenAddress,
        dummyFromAddress
      ),
    [ChainId.OPTIMISM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.OptimismQueries(
        provider,
        undefined,
        optimismUsdcRoute.fromSpokeAddress,
        optimismUsdcRoute.fromTokenAddress,
        dummyFromAddress
      ),
    [ChainId.BOBA]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.BobaQueries(provider),
    [ChainId.POLYGON]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.PolygonQueries(provider),
    [ChainId.KOVAN]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.RINKEBY]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.GOERLI]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.MUMBAI]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.PolygonQueries(provider),
    // Use hardcoded DAI address instead of USDC because DAI is enabled here.
    [ChainId.KOVAN_OPTIMISM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.OptimismQueries(
        provider,
        undefined,
        "0x1954D4A36ac4fD8BEde42E59368565A92290E705",
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
      ),
    // Use hardcoded WETH address instead of USDC because WETH is enabled here.
    [ChainId.ARBITRUM_RINKEBY]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.ArbitrumQueries(
        provider,
        undefined,
        "0x3BED21dAe767e4Df894B31b14aD32369cE4bad8b",
        "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681"
      ),
  };
};

export const queriesTable = getQueriesTable();

export const referrerDelimiterHex = "0xd00dfeeddeadbeef";

export const usdcLpCushion = process.env.REACT_APP_USDC_LP_CUSHION || "0";
export const wethLpCushion = process.env.REACT_APP_WETH_LP_CUSHION || "0";
export const wbtcLpCushion = process.env.REACT_APP_WBTC_LP_CUSHION || "0";
export const daiLpCushion = process.env.REACT_APP_DAI_LP_CUSHION || "0";

export const maxRelayFee = 0.25; // 25%
export const minRelayFee = 0.0003; // 0.03%
// Chains where Blocknative Notify can be used. See https://docs.blocknative.com/notify#initialization
export const supportedNotifyChainIds = [1, 3, 4, 5, 42, 56, 100, 137, 250];

export const mockServerlessAPI =
  process.env.REACT_APP_MOCK_SERVERLESS === "true";
