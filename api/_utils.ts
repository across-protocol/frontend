import {
  HubPool__factory,
  ERC20__factory,
  SpokePool__factory,
  SpokePool,
} from "@across-protocol/contracts-v2";
import axios from "axios";
import * as sdk from "@across-protocol/sdk-v2";
import { BigNumber, ethers, providers } from "ethers";
import { Log, Logging } from "@google-cloud/logging";
import enabledRoutesAsJson from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";

import { maxRelayFeePct, relayerFeeCapitalCostConfig } from "./_constants";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import QueryBase from "@across-protocol/sdk-v2/dist/relayFeeCalculator/chain-queries/baseQuery";
import { VercelResponse } from "@vercel/node";

type LoggingUtility = sdk.relayFeeCalculator.Logger;

const {
  REACT_APP_PUBLIC_INFURA_ID,
  REACT_APP_COINGECKO_PRO_API_KEY,
  REACT_APP_GOOGLE_SERVICE_ACCOUNT,
  VERCEL_ENV,
  GAS_MARKUP,
  DISABLE_DEBUG_LOGS,
} = process.env;

const GOOGLE_SERVICE_ACCOUNT = REACT_APP_GOOGLE_SERVICE_ACCOUNT
  ? JSON.parse(REACT_APP_GOOGLE_SERVICE_ACCOUNT)
  : {};

export const gasMarkup = GAS_MARKUP ? JSON.parse(GAS_MARKUP) : {};
// Default to no markup.
export const DEFAULT_GAS_MARKUP = 0;

/**
 * Writes a log using the google cloud logging utility
 * @param gcpLogger A defined google cloud logging instance
 * @param severity A string opcode for severity
 * @param data an arbitrary data input that will be logged to the cloud utility
 */
export const log = (
  gcpLogger: Log,
  severity: "DEBUG" | "INFO" | "WARN" | "ERROR",
  data: LogType
) => {
  if (DISABLE_DEBUG_LOGS === "true" && severity === "DEBUG") {
    console.log(data);
    return;
  }
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

type LogType = any;
// Singleton logger so we don't create multiple.
let logger: LoggingUtility;
/**
 * Resolves a logging utility to be used. This instance caches its responses
 * @returns A valid Logging utility that can be used throughout the runtime
 */
export const getLogger = (): LoggingUtility => {
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
      debug: (data: LogType) => log(gcpLogger, "DEBUG", data),
      info: (data: LogType) => log(gcpLogger, "INFO", data),
      warn: (data: LogType) => log(gcpLogger, "WARN", data),
      error: (data: LogType) => log(gcpLogger, "ERROR", data),
    };
  }
  return logger;
};

/**
 * Resolves the current vercel endpoint dynamically
 * @returns A valid URL of the current endpoint in vercel
 */
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
  provider: providers.Provider,
  l1Token?: string,
  l2Token?: string,
  chainId?: string
) => {
  const hubPool = HubPool__factory.connect(
    "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    provider
  );

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

  return {
    hubPool,
    chainId: event.args.destinationChainId.toNumber(),
    l1Token: event.args.l1Token,
    l2Token: event.args.destinationToken,
  };
};

export class InputError extends Error {}

/**
 * Resolves an Infura provider given the name of the ETH network
 * @param name The name of an ethereum network
 * @returns A valid Ethers RPC provider
 */
export const infuraProvider = (name: string) => {
  const url = `https://${name}.infura.io/v3/${REACT_APP_PUBLIC_INFURA_ID}`;
  return new ethers.providers.StaticJsonRpcProvider(url);
};

/**
 * Resolves a fixed Static RPC provider
 * @returns A valid Boba Provider that can be used to query the Boba blockchain
 */
export const bobaProvider = (): providers.StaticJsonRpcProvider =>
  new ethers.providers.StaticJsonRpcProvider("https://mainnet.boba.network");

/**
 * Generates a fixed HubPoolClientConfig object
 * @returns A fixed constant
 */
export const makeHubPoolClientConfig = () => {
  return {
    chainId: 1,
    hubPoolAddress: "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    configStoreAddress: "0x3B03509645713718B78951126E0A6de6f10043f5",
  };
};

/**
 * Resolves the current HubPoolClient
 * @returns A HubPool client that can query the blockchain
 */
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

export const getGasMarkup = (chainId: string | number) => {
  return gasMarkup[chainId] ?? DEFAULT_GAS_MARKUP;
};

export const queries: Record<number, () => QueryBase> = {
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

/**
 * Retrieves an isntance of the Across SDK RelayFeeCalculator
 * @param destinationChainId The destination chain that a bridge operation will transfer to
 * @returns An instance of the `RelayFeeCalculator` for the specific chain specified by `destinationChainId`
 */
export const getRelayerFeeCalculator = (destinationChainId: number) => {
  const queryFn = queries[destinationChainId];
  if (queryFn === undefined) {
    throw new InputError(`Invalid destination chain Id: ${destinationChainId}`);
  }

  const relayerFeeCalculatorConfig = {
    feeLimitPercent: maxRelayFeePct * 100,
    capitalCostsPercent: 0.04,
    queries: queryFn(),
    capitalCostsConfig: relayerFeeCapitalCostConfig,
  };
  return new sdk.relayFeeCalculator.RelayFeeCalculator(
    relayerFeeCalculatorConfig,
    logger
  );
};

/**
 * Resolves a tokenAddress to a given textual symbol
 * @param tokenAddress The token address to convert into a symbol
 * @returns A corresponding symbol to the given `tokenAddress`
 */
export const getTokenSymbol = (tokenAddress: string): string => {
  const symbol = Object.entries(sdk.relayFeeCalculator.SymbolMapping)?.find(
    ([_symbol, { address }]) =>
      address.toLowerCase() === tokenAddress.toLowerCase()
  )?.[0];
  if (!symbol) {
    throw new InputError("Token address provided was not whitelisted.");
  }
  return symbol;
};

/**
 * Retrieves the results of the `relayFeeCalculator` SDK function: `relayerFeeDetails`
 * @param l1Token A valid L1 ERC-20 token address
 * @param amount  The amount of funds that are requesting to be transferred
 * @param destinationChainId The destination chain that this token will be transferred to
 * @param tokenPrice An optional overred price to prevent the SDK from creating its own call
 * @returns The a promise to the relayer fee for the given `amount` of transferring `l1Token` to `destinationChainId`
 */
export const getRelayerFeeDetails = (
  l1Token: string,
  amount: sdk.utils.BigNumberish,
  destinationChainId: number,
  tokenPrice?: number
) => {
  const tokenSymbol = getTokenSymbol(l1Token);
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId);
  return relayFeeCalculator.relayerFeeDetails(amount, tokenSymbol, tokenPrice);
};

/**
 * Creates an HTTP call to the `/api/coingecko` endpoint to resolve a CoinGecko price
 * @param l1Token The ERC20 token address of the coin to find the cached price of
 * @returns The price of the `l1Token` token.
 */
export const getCachedTokenPrice = async (
  l1Token: string,
  baseCurrency: string = "eth"
): Promise<number> => {
  return Number(
    (
      await axios(`${resolveVercelEndpoint()}/api/coingecko`, {
        params: { l1Token, baseCurrency },
      })
    ).data.price
  );
};

export const providerCache: Record<string, StaticJsonRpcProvider> = {};

/**
 * Generates a relevant provider for the given input chainId
 * @param _chainId A valid chain identifier where an AcrossV2 contract is deployed
 * @returns A provider object to query the requested blockchain
 */
export const getProvider = (_chainId: number): providers.Provider => {
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

/**
 * Generates a relevant SpokePool given the input chain ID
 * @param _chainId A valid chain Id that corresponds to an available AcrossV2 Spoke Pool
 * @returns The corresponding SpokePool for the given `_chainId`
 */
export const getSpokePool = (_chainId: number): SpokePool => {
  const chainId = _chainId.toString();
  const provider = getProvider(_chainId);
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

/**
 * Determines if a given route is enabled to support an AcrossV2 bridge
 * @param _fromChainId The chain id of the origin bridge action
 * @param _toChainId The chain id of the destination bridge action.
 * @param _fromToken The originating token address. Note: is a valid ERC-20 address
 * @returns A boolean representing if a route with these parameters is available
 */
export const isRouteEnabled = (
  fromChainId: number,
  toChainId: number,
  fromToken: string
): boolean => {
  const enabled = enabledRoutesAsJson.routes.some(
    ({ fromTokenAddress, fromChain, toChain }) =>
      fromChainId === fromChain &&
      toChainId === toChain &&
      fromToken.toLowerCase() === fromTokenAddress.toLowerCase()
  );
  return enabled;
};

/**
 * Resolves the balance of a given ERC20 token at a provided address
 * @param chainId The blockchain Id to query against
 * @param token The valid ERC20 token address on the given `chainId`
 * @param account A valid Web3 wallet address
 * @param blockTag A blockTag to specify a historical balance date
 * @returns A promise that resolves to the BigNumber of the balance
 */
export const getBalance = (
  chainId: string | number,
  token: string,
  account: string,
  blockTag: number | "latest" = "latest"
): Promise<BigNumber> => {
  return ERC20__factory.connect(token, getProvider(Number(chainId))).balanceOf(
    account,
    { blockTag }
  );
};

/**
 * Finds the largest number in an array of `BigNumber` values
 * @param arr The array to find the largest number
 * @returns The largest bigNumber
 */
export const maxBN = (...arr: BigNumber[]): BigNumber => {
  return [...arr].sort((a, b) => {
    if (b.gt(a)) return 1;
    if (a.gt(b)) return -1;
    return 0;
  })[0];
};

/**
 * Finds the smallest number in an array of `BigNumber` values
 * @param arr The array to find the smallest number
 * @returns The Smallest bigNumber
 */
export const minBN = (...arr: BigNumber[]): BigNumber => {
  return [...arr].sort((a, b) => {
    if (a.gt(b)) return 1;
    if (b.gt(a)) return -1;
    return 0;
  })[0];
};

/**
 * Performs an O(n) time filter-then-map
 * @param array array An array of elements to apply this transform
 * @param filterFn A function which resolves a boolean. A true return will appear in the final output array
 * @param mappingFn A function to transform an array element into the mapping
 * @returns A copy of the `array`, but filtered and mapped
 */
export function applyFilterMap<InputType, MapType>(
  array: InputType[],
  filterFn: (arg: InputType) => boolean,
  mappingFn: (arg: InputType) => MapType
): MapType[] {
  return array.reduce((accumulator: MapType[], currentValue: InputType) => {
    if (filterFn(currentValue)) {
      accumulator.push(mappingFn(currentValue));
    }
    return accumulator;
  }, []);
}

/**
 * Performs a filter after amapping operation in O(n) time
 * @param array array An array of elements to apply this transform
 * @param filterFn A function which resolves a boolean. A true return will appear in the final output array
 * @param mappingFn A function to transform an array element into the mapping
 * @param mapFirst If true, the element will be transformed prior to being filtered
 * @returns A copy of the `array`, but filtered and mapped
 */
export function applyMapFilter<InputType, MapType>(
  array: InputType[],
  filterFn: (arg: MapType) => boolean,
  mappingFn: (arg: InputType) => MapType
) {
  return array.reduce((accumulator: MapType[], currentValue: InputType) => {
    const currentValueMapping = mappingFn(currentValue);
    if (filterFn(currentValueMapping)) {
      accumulator.push(currentValueMapping);
    }
    return accumulator;
  }, []);
}

/**
 * Handles the recurring case of error handling
 * @param endpoint A string numeric to indicate to the logging utility where this error occurs
 * @param response A VercelResponse object that is used to interract with the returning reponse
 * @param logger A logging utility to write to a cloud logging provider
 * @param error The error that will be returned to the user
 * @returns The `response` input with a status/send sent. Note: using this object again will cause an exception
 */
export function handleErrorCondition(
  endpoint: string,
  response: VercelResponse,
  logger: LoggingUtility,
  error: unknown
): VercelResponse {
  if (!(error instanceof Error)) {
    return response.status(500).send("Error could not be defined.");
  }
  let status: number;
  if (error instanceof InputError) {
    logger.warn({ at: endpoint, message: "400 input error", error });
    status = 400;
  } else {
    logger.error({ at: endpoint, message: "500 server error", error });
    status = 500;
  }
  return response.status(status).send(error.message);
}
