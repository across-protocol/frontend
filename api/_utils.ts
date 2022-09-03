import {
  HubPool__factory,
  ERC20__factory,
  SpokePool__factory,
} from "@across-protocol/contracts-v2";
import axios from "axios";
import * as sdk from "@across-protocol/sdk-v2";
import ethers from "ethers";
import { Logging } from "@google-cloud/logging";
import enabledRoutesAsJson from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";

import { relayerFeeCapitalCostConfig } from "./_constants";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

const {
  REACT_APP_PUBLIC_INFURA_ID,
  REACT_APP_COINGECKO_PRO_API_KEY,
  REACT_APP_GOOGLE_SERVICE_ACCOUNT,
  VERCEL_ENV,
  GAS_MARKUP,
} = process.env;

const GOOGLE_SERVICE_ACCOUNT = REACT_APP_GOOGLE_SERVICE_ACCOUNT
  ? JSON.parse(REACT_APP_GOOGLE_SERVICE_ACCOUNT)
  : {};

export const gasMarkup = GAS_MARKUP ? JSON.parse(GAS_MARKUP) : {};
// Default to no markup.
export const DEFAULT_GAS_MARKUP = 0;

export const log = (gcpLogger: any, severity: any, data: any) => {
  let message = JSON.stringify(data, null, 4);
  // Fire and forget. we don't wait for this to finish.
  gcpLogger
    .write(
      gcpLogger.entry(
        {
          resource: {
            type: "global",
          },
          severity: severity,
        },
        message
      )
    )
    .catch((error: Error) => {
      // Ensure API doesn't fail if logging to GCP fails.
      sdk.relayFeeCalculator.DEFAULT_LOGGER.error({
        at: "GCP logger",
        message: "Failed to log to GCP",
        error,
        data,
      });
    });
};

// Singleton logger so we don't create multiple.
let logger: any;
export const getLogger = () => {
  // Use the default logger which logs to console if no GCP service account is configured.
  if (Object.keys(GOOGLE_SERVICE_ACCOUNT).length === 0) {
    logger = sdk.relayFeeCalculator.DEFAULT_LOGGER;
  }

  if (!logger) {
    const gcpLogger = new Logging({
      projectId: GOOGLE_SERVICE_ACCOUNT.project_id,
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT.client_email,
        private_key: GOOGLE_SERVICE_ACCOUNT.private_key,
      },
    }).log(VERCEL_ENV ?? "", { removeCircular: true });
    logger = {
      debug: (data: any) => log(gcpLogger, "DEBUG", data),
      info: (data: any) => log(gcpLogger, "INFO", data),
      warn: (data: any) => log(gcpLogger, "WARN", data),
      error: (data: any) => log(gcpLogger, "ERROR", data),
    };
  }
  return logger;
};

export const resolveVercelEndpoint = () => {
  const url = process.env.VERCEL_URL ?? "across.to";
  const env = process.env.VERCEL_ENV ?? "development";
  switch (env) {
    case "preview":
    case "production":
      return `https://${url}`;
    case "development":
    default:
      return `http://localhost:3000`;
  }
};

export const getTokenDetails = async (
  provider: any,
  l1Token: any,
  l2Token: any,
  chainId: any
) => {
  const hubPool = HubPool__factory.connect(
    "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    provider
  );
  getLogger().debug({
    at: "getTokenDetails",
    message: "Fetching token details",
    l1Token,
    l2Token,
    chainId,
  });

  // 2 queries: treating the token as the l1Token or treating the token as the L2 token.
  const l2TokenFilter = hubPool.filters.SetPoolRebalanceRoute(
    undefined,
    l1Token,
    l2Token
  );

  // Filter events by chainId.
  const events = (await hubPool.queryFilter(l2TokenFilter, 0, "latest")).filter(
    (event) => !chainId || event.args.destinationChainId.toString() === chainId
  );

  if (events.length === 0) throw new InputError("No whitelisted token found");

  // Sorting from most recent to oldest.
  events.sort((a, b) => {
    if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
    if (b.transactionIndex !== a.transactionIndex)
      return b.transactionIndex - a.transactionIndex;
    return b.logIndex - a.logIndex;
  });

  const event = events[0];
  getLogger().debug({
    at: "getTokenDetails",
    message: "Fetched pool rebalance route event",
    event,
  });

  return {
    hubPool,
    chainId: event.args.destinationChainId.toNumber(),
    l1Token: event.args.l1Token,
    l2Token: event.args.destinationToken,
  };
};

export const isString = (input: any) => typeof input === "string";

export class InputError extends Error {}

export const infuraProvider = (name: any) => {
  const url = `https://${name}.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`;
  getLogger().info({
    at: "infuraProvider",
    message: "Using an Infura provider",
    url,
  });
  return new ethers.providers.StaticJsonRpcProvider(url);
};

export const bobaProvider = () =>
  new ethers.providers.StaticJsonRpcProvider("https://mainnet.boba.network");

export const makeHubPoolClientConfig = () => {
  return {
    chainId: 1,
    hubPoolAddress: "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    configStoreAddress: "0x3B03509645713718B78951126E0A6de6f10043f5",
  };
};

export const getHubPoolClient = () => {
  const hubPoolConfig = makeHubPoolClientConfig();
  return new sdk.pool.Client(
    hubPoolConfig,
    {
      provider: infuraProvider("mainnet"),
    },
    (_, __) => {} // Dummy function that does nothing and is needed to construct this client.
  );
};

// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9) and Arbitrum
// (0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
export const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

export const getGasMarkup = (chainId: any) => {
  return gasMarkup[chainId] ?? DEFAULT_GAS_MARKUP;
};

export const queries = {
  1: () =>
    new sdk.relayFeeCalculator.EthereumQueries(
      infuraProvider("mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(1)
    ),
  10: () =>
    new sdk.relayFeeCalculator.OptimismQueries(
      infuraProvider("optimism-mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(10)
    ),
  137: () =>
    new sdk.relayFeeCalculator.PolygonQueries(
      infuraProvider("polygon-mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(137)
    ),
  288: () =>
    new sdk.relayFeeCalculator.BobaQueries(
      bobaProvider(),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(288)
    ),
  42161: () =>
    new sdk.relayFeeCalculator.ArbitrumQueries(
      infuraProvider("arbitrum-mainnet"),
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(42161)
    ),
};

export const maxRelayFeePct = 0.25;

export const getRelayerFeeCalculator = (destinationChainId: number) => {
  const relayerFeeCalculatorConfig = {
    feeLimitPercent: maxRelayFeePct * 100,
    capitalCostsPercent: 0.04,
    queries: (queries as any)[destinationChainId](),
    capitalCostsConfig: relayerFeeCapitalCostConfig,
  };
  getLogger().info({
    at: "getRelayerFeeDetails",
    message: "Relayer fee calculator config",
    relayerFeeCalculatorConfig,
  });
  return new sdk.relayFeeCalculator.RelayFeeCalculator(
    relayerFeeCalculatorConfig,
    logger
  );
};
export const getTokenSymbol = (tokenAddress: string): any | undefined => {
  return Object.entries(sdk.relayFeeCalculator.SymbolMapping)?.find(
    ([_symbol, { address }]) =>
      address.toLowerCase() === tokenAddress.toLowerCase()
  )?.[0];
};
export const getRelayerFeeDetails = (
  l1Token: any,
  amount: any,
  destinationChainId: any,
  tokenPrice: any
) => {
  const tokenSymbol = getTokenSymbol(l1Token);
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId);
  return relayFeeCalculator.relayerFeeDetails(amount, tokenSymbol, tokenPrice);
};

export const getTokenPrice = (l1Token: any, destinationChainId: any) => {
  const tokenSymbol = getTokenSymbol(l1Token);
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId);
  return relayFeeCalculator.getTokenPrice(tokenSymbol);
};

export const getCachedTokenPrice = async (l1Token: any) => {
  getLogger().debug({
    at: "getCachedTokenPrice",
    message: `Resolving price from ${resolveVercelEndpoint()}/api/coingecko`,
  });
  return Number(
    (
      await axios(`${resolveVercelEndpoint()}/api/coingecko`, {
        params: { l1Token },
      })
    ).data.price
  );
};

export const providerCache: Record<string, StaticJsonRpcProvider> = {};

export const getProvider = (_chainId: string) => {
  const chainId = _chainId.toString();
  if (!providerCache[chainId]) {
    switch (chainId.toString()) {
      case "1":
        providerCache[chainId] = infuraProvider("mainnet");
        break;
      case "10":
        providerCache[chainId] = infuraProvider("optimism-mainnet");
        break;
      case "137":
        providerCache[chainId] = infuraProvider("polygon-mainnet");
        break;
      case "288":
        providerCache[chainId] = bobaProvider();
        break;
      case "42161":
        providerCache[chainId] = infuraProvider("arbitrum-mainnet");
        break;
      default:
        throw new Error(`Invalid chainId provided: ${chainId}`);
    }
  }
  return providerCache[chainId];
};

export const getSpokePool = (_chainId: any) => {
  const chainId = _chainId.toString();
  const provider = getProvider(chainId);
  switch (chainId.toString()) {
    case "1":
      return SpokePool__factory.connect(
        "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381",
        provider
      );
    case "10":
      return SpokePool__factory.connect(
        "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9",
        provider
      );
    case "137":
      return SpokePool__factory.connect(
        "0x69B5c72837769eF1e7C164Abc6515DcFf217F920",
        provider
      );
    case "288":
      return SpokePool__factory.connect(
        "0xBbc6009fEfFc27ce705322832Cb2068F8C1e0A58",
        provider
      );
    case "42161":
      return SpokePool__factory.connect(
        "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C",
        provider
      );
    default:
      throw new Error(`Invalid chainId provided: ${chainId}`);
  }
};

export const isRouteEnabled = (
  fromChainId: any,
  toChainId: any,
  fromToken: any
) => {
  fromChainId = Number(fromChainId);
  toChainId = Number(toChainId);
  const enabled = enabledRoutesAsJson.routes.some(
    ({ fromTokenAddress, fromChain, toChain }) =>
      fromChainId === fromChain &&
      toChainId === toChain &&
      fromToken.toLowerCase() === fromTokenAddress.toLowerCase()
  );
  return enabled;
};

export const getBalance = (
  chainId: string,
  token: string,
  account: string,
  blockTag = "latest"
) => {
  return ERC20__factory.connect(token, getProvider(chainId)).balanceOf(
    account,
    { blockTag }
  );
};

export const maxBN = (...arr: any[]) => {
  return [...arr].sort((a, b) => {
    if (b.gt(a)) return 1;
    if (a.gt(b)) return -1;
    return 0;
  })[0];
};

export const minBN = (...arr: any[]) => {
  return [...arr].sort((a, b) => {
    if (a.gt(b)) return 1;
    if (b.gt(a)) return -1;
    return 0;
  })[0];
};

/**
 * Performs a filter-map operation in O(n) time
 * @param {any[]} array An array of elements to apply this transform
 * @param {(any) => boolean} filterFn A function which resolves a boolean. A true return will appear in the final output array
 * @param {(any) => any} mappingFn A function to transform an array element into the mapping
 * @param {boolean} mapFirst If true, the element will be transformed prior to being filtered
 * @returns {any[]} A copy of the `array`, but filtered and mapped
 */
export const filterMapArray = (
  array: any[],
  filterFn: (arg: any) => boolean,
  mappingFn: (arg: any) => any,
  mapFirst: boolean
): any[] => {
  const reducerFn = mapFirst
    ? (accumulator: any, currentValue: any) => {
        const currentValueMapping = mappingFn(currentValue);
        if (filterFn(currentValueMapping)) {
          accumulator.push(currentValueMapping);
        }
        return accumulator;
      }
    : (accumulator: any, currentValue: any) => {
        if (filterFn(currentValue)) {
          accumulator.push(mappingFn(currentValue));
        }
        return accumulator;
      };
  return array.reduce(reducerFn, []);
};
