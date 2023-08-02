import {
  HubPool__factory,
  ERC20__factory,
  SpokePool__factory,
  SpokePool,
} from "@across-protocol/contracts-v2/dist/typechain";
import axios from "axios";
import * as sdk from "@across-protocol/sdk-v2";
import { BigNumber, ethers, providers, utils } from "ethers";
import { Log, Logging } from "@google-cloud/logging";
import { define, StructError } from "superstruct";
import { BalancerSDK, BALANCER_NETWORK_CONFIG } from "@balancer-labs/sdk";

import enabledMainnetRoutesAsJson from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import enabledGoerliRoutesAsJson from "../src/data/routes_5_0x0e2817C49698cc0874204AeDf7c72Be2Bb7fCD5d.json";

import { maxRelayFeePct, relayerFeeCapitalCostConfig } from "./_constants";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import QueryBase from "@across-protocol/sdk-v2/dist/relayFeeCalculator/chain-queries/baseQuery";
import { VercelResponse } from "@vercel/node";

type LoggingUtility = sdk.relayFeeCalculator.Logger;

const {
  REACT_APP_HUBPOOL_CHAINID,
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

// Don't permit HUB_POOL_CHAIN_ID=0
export const HUB_POOL_CHAIN_ID = Number(REACT_APP_HUBPOOL_CHAINID || 1);

// Permit REACT_APP_FLAT_RELAY_CAPITAL_FEE=0
export const FLAT_RELAY_CAPITAL_FEE = Number(
  process.env.REACT_APP_FLAT_RELAY_CAPITAL_FEE ?? 0.03
); // 0.03%

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

const _ENABLED_ROUTES =
  HUB_POOL_CHAIN_ID === 1
    ? enabledMainnetRoutesAsJson
    : enabledGoerliRoutesAsJson;

_ENABLED_ROUTES.routes = _ENABLED_ROUTES.routes.filter(
  ({ fromChain, toChain, fromTokenSymbol }) =>
    ![fromChain, toChain].some((chainId) =>
      DISABLED_CHAINS.includes(chainId.toString())
    ) && !DISABLED_ROUTE_TOKENS.includes(fromTokenSymbol)
);

export const ENABLED_ROUTES = _ENABLED_ROUTES;

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
  // JSON.stringify(error) returns "{}", to mitigate we replace the error with
  // a custom object that contains the error message and stack.
  const dataWithReplacedError = data.error
    ? {
        ...data,
        error: {
          message: data.error?.message,
          stack: data.error?.stack,
        },
      }
    : data;
  let message = JSON.stringify(dataWithReplacedError, null, 4);
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
    ENABLED_ROUTES.hubPoolAddress,
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
 * @param nameOrChainId The name of an ethereum network
 * @returns A valid Ethers RPC provider
 */
export const infuraProvider = (nameOrChainId: providers.Networkish) => {
  const url = new ethers.providers.InfuraProvider(
    nameOrChainId,
    REACT_APP_PUBLIC_INFURA_ID
  ).connection.url;
  return new ethers.providers.StaticJsonRpcProvider(url);
};

/**
 * Resolves a fixed Static RPC provider if an override url has been specified.
 * @returns A provider or undefined if an override was not specified.
 */
export const overrideProvider = (
  chainId: string
): providers.StaticJsonRpcProvider | undefined => {
  const url = process.env[`OVERRIDE_PROVIDER_${chainId}`];
  if (url) {
    return new ethers.providers.StaticJsonRpcProvider(url);
  } else {
    return undefined;
  }
};

/**
 * Generates a fixed HubPoolClientConfig object
 * @returns A fixed constant
 */
export const makeHubPoolClientConfig = (chainId = 1) => {
  return {
    1: {
      chainId: 1,
      hubPoolAddress: "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
      wethAddress:
        sdk.constants.TOKEN_SYMBOLS_MAP.WETH.addresses[
          sdk.constants.CHAIN_IDs.MAINNET
        ],
      configStoreAddress: "0x3B03509645713718B78951126E0A6de6f10043f5",
      acceleratingDistributorAddress:
        "0x9040e41eF5E8b281535a96D9a48aCb8cfaBD9a48",
      merkleDistributorAddress: "0xE50b2cEAC4f60E840Ae513924033E753e2366487",
    },
    5: {
      chainId: 5,
      hubPoolAddress: "0x0e2817C49698cc0874204AeDf7c72Be2Bb7fCD5d",
      wethAddress:
        sdk.constants.TOKEN_SYMBOLS_MAP.WETH.addresses[
          sdk.constants.CHAIN_IDs.GOERLI
        ],
      configStoreAddress: "0x3215e3C91f87081757d0c41EF0CB77738123Be83",
      acceleratingDistributorAddress:
        "0xA59CE9FDFf8a0915926C2AF021d54E58f9B207CC",
      merkleDistributorAddress: "0xF633b72A4C2Fb73b77A379bf72864A825aD35b6D",
    },
  }[chainId] as {
    chainId: number;
    hubPoolAddress: string;
    wethAddress: string;
    configStoreAddress: string;
    acceleratingDistributorAddress: string;
    merkleDistributorAddress: string;
  };
};

/**
 * Resolves the current HubPoolClient
 * @returns A HubPool client that can query the blockchain
 */
export const getHubPoolClient = () => {
  const hubPoolConfig = makeHubPoolClientConfig(HUB_POOL_CHAIN_ID);
  return new sdk.pool.Client(
    hubPoolConfig,
    {
      provider: infuraProvider(HUB_POOL_CHAIN_ID),
    },
    (_, __) => {} // Dummy function that does nothing and is needed to construct this client.
  );
};

// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0x6f26Bf09B1C792e3228e5467807a900A503c0281) and Arbitrum
// (0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
export const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

export const getGasMarkup = (chainId: string | number) => {
  return gasMarkup[chainId] ?? DEFAULT_GAS_MARKUP;
};

export const providerForChain: {
  [chainId: number]: ethers.providers.StaticJsonRpcProvider;
} = {
  1: infuraProvider(1),
  10: infuraProvider(10),
  137: infuraProvider(137),
  42161: infuraProvider(42161),
  // testnets
  5: infuraProvider(5),
  421613: infuraProvider(421613),
};
export const queries: Record<number, () => QueryBase> = {
  1: () =>
    new sdk.relayFeeCalculator.EthereumQueries(
      providerForChain[1],
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
      providerForChain[10],
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
      providerForChain[137],
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(137)
    ),
  42161: () =>
    new sdk.relayFeeCalculator.ArbitrumQueries(
      providerForChain[42161],
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(42161)
    ),
  // testnets
  5: () =>
    new sdk.relayFeeCalculator.EthereumQueries(
      providerForChain[5],
      undefined,
      "0x063fFa6C9748e3f0b9bA8ee3bbbCEe98d92651f7",
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(5)
    ),
  421613: () =>
    new sdk.relayFeeCalculator.EthereumQueries(
      providerForChain[421613],
      undefined,
      undefined,
      undefined,
      undefined,
      REACT_APP_COINGECKO_PRO_API_KEY,
      getLogger(),
      getGasMarkup(421613)
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
    throw new InputError("Invalid destination chain Id");
  }

  const relayerFeeCalculatorConfig = {
    feeLimitPercent: maxRelayFeePct * 100,
    capitalCostsPercent: FLAT_RELAY_CAPITAL_FEE, // This is set same way in ./src/utils/bridge.ts
    queries: queryFn(),
    capitalCostsConfig: relayerFeeCapitalCostConfig,
  };
  if (relayerFeeCalculatorConfig.feeLimitPercent < 1)
    throw new Error(
      "Setting fee limit % < 1% will produce nonsensical relay fee details"
    );
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
  const symbol = Object.entries(sdk.constants.TOKEN_SYMBOLS_MAP)?.find(
    ([_symbol, { addresses }]) =>
      addresses[HUB_POOL_CHAIN_ID]?.toLowerCase() === tokenAddress.toLowerCase()
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
 * @param originChainId The origin chain that this token will be transferred from
 * @param destinationChainId The destination chain that this token will be transferred to
 * @param tokenPrice An optional overred price to prevent the SDK from creating its own call
 * @returns The a promise to the relayer fee for the given `amount` of transferring `l1Token` to `destinationChainId`
 */
export const getRelayerFeeDetails = (
  l1Token: string,
  amount: sdk.utils.BigNumberish,
  originChainId: number,
  destinationChainId: number,
  tokenPrice?: number
): Promise<sdk.relayFeeCalculator.RelayerFeeDetails> => {
  const tokenSymbol = getTokenSymbol(l1Token);
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId);
  return relayFeeCalculator.relayerFeeDetails(
    amount,
    tokenSymbol,
    tokenPrice,
    originChainId.toString(),
    destinationChainId.toString()
  );
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
    const override = overrideProvider(chainId);
    if (override) {
      providerCache[chainId] = override;
    } else {
      providerCache[chainId] = providerForChain[_chainId];
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
  const spokePoolAddress = getSpokePoolAddress(_chainId);
  return SpokePool__factory.connect(spokePoolAddress, getProvider(_chainId));
};

export const getSpokePoolAddress = (_chainId: number): string => {
  const chainId = _chainId.toString();
  switch (chainId.toString()) {
    case "1":
      return "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5";
    case "10":
      return "0x6f26Bf09B1C792e3228e5467807a900A503c0281";
    case "137":
      return "0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096";
    case "288":
      return "0xBbc6009fEfFc27ce705322832Cb2068F8C1e0A58";
    case "42161":
      return "0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A";
    default:
      throw new Error("Invalid chainId provided");
  }
};

/**
 * Determines if a given route is enabled to support an AcrossV2 bridge
 * @param fromChainId The chain id of the origin bridge action
 * @param toChainId The chain id of the destination bridge action.
 * @param fromToken The originating token address. Note: is a valid ERC-20 address
 * @returns A boolean representing if a route with these parameters is available
 */
export const isRouteEnabled = (
  fromChainId: number,
  toChainId: number,
  fromToken: string
): boolean => {
  const enabled = ENABLED_ROUTES.routes.some(
    ({ fromTokenAddress, fromChain, toChain, fromTokenSymbol }) =>
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
    console.error("Error could not be defined.", error);
    return response.status(500).send("Error could not be defined.");
  }
  let status: number;
  if (error instanceof InputError) {
    logger.warn({
      at: endpoint,
      message: `400 input error: ${error.message}`,
    });
    status = 400;
  } else if (error instanceof StructError) {
    logger.warn({
      at: endpoint,
      message: `400 validation error: ${error.message}`,
    });
    status = 400;
    const { type, path } = error;
    // Sanitize the error message that will be sent to client
    error.message = `ValidationError - At path: ${path}. Expected type: ${type}`;
  } else {
    logger.error({
      at: endpoint,
      message: "500 server error",
    });
    status = 500;
  }
  console.error(error);
  return response.status(status).send(error.message);
}

/* ------------------------- superstruct validators ------------------------- */

export function parsableBigNumberString() {
  return define<string>("parsableBigNumberString", (value) => {
    try {
      BigNumber.from(value);
      return true;
    } catch (error) {
      return false;
    }
  });
}

export function validAddress() {
  return define<string>("validAddress", (value) =>
    utils.isAddress(value as string)
  );
}

export function validAddressOrENS() {
  return define<string>("validAddressOrENS", (value) => {
    const ensDomainRegex =
      // eslint-disable-next-line no-useless-escape
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
    return (
      utils.isAddress(value as string) || ensDomainRegex.test(value as string)
    );
  });
}

export function positiveIntStr() {
  return define<string>("positiveIntStr", (value) => {
    return Number.isInteger(Number(value)) && Number(value) > 0;
  });
}

export function boolStr() {
  return define<string>("boolStr", (value) => {
    return value === "true" || value === "false";
  });
}

/**
 * Returns the cushion for a given token symbol and route. If no route is specified, the cushion for the token symbol
 * @param symbol The token symbol
 * @param fromChainId The origin chain ID
 * @param toChainId The destination chain ID
 * @returns The cushion in wei
 */
export function getLpCushion(
  symbol: string,
  fromChainId?: number,
  toChainId?: number
) {
  return (
    [
      `REACT_APP_LP_CUSHION_${symbol}_${fromChainId}_${toChainId}`,
      `REACT_APP_LP_CUSHION_${symbol}_${fromChainId}`,
      `REACT_APP_LP_CUSHION_${symbol}`,
    ]
      .map((key) => process.env[key])
      .find((value) => value !== undefined) ?? "0"
  );
}

export async function tagReferrer(
  dataHex: string,
  referrerAddressOrENS: string
) {
  let referrerAddress: string | null;

  if (ethers.utils.isAddress(referrerAddressOrENS)) {
    referrerAddress = referrerAddressOrENS;
  } else {
    const provider = infuraProvider(1);
    referrerAddress = await provider.resolveName(referrerAddressOrENS);
  }

  if (!referrerAddress) {
    throw new Error("Invalid referrer address or ENS name");
  }

  if (!ethers.utils.isHexString(dataHex)) {
    throw new Error("Data must be a valid hex string");
  }

  return ethers.utils.hexConcat([
    dataHex,
    "0xd00dfeeddeadbeef",
    referrerAddress,
  ]);
}

export function getFallbackTokenLogoURI(l1TokenAddress: string) {
  const isACX =
    sdk.constants.TOKEN_SYMBOLS_MAP.ACX.addresses[1] === l1TokenAddress;

  if (isACX) {
    return "https://across.to/logo-small.png";
  }

  return `https://github.com/trustwallet/assets/blob/master/blockchains/ethereum/assets/${l1TokenAddress}/logo.png?raw=true`;
}

export async function getPoolState(
  tokenAddress: string,
  externalPoolProvider?: string
) {
  if (!externalPoolProvider) {
    const hubPoolClient = getHubPoolClient();
    await hubPoolClient.updatePool(tokenAddress);
    return hubPoolClient.getPoolState(tokenAddress);
  }

  return getExternalPoolState(tokenAddress, externalPoolProvider);
}

export async function getExternalPoolState(
  tokenAddress: string,
  externalPoolProvider: string
) {
  switch (externalPoolProvider) {
    case "balancer":
      return getBalancerPoolState(tokenAddress);
    default:
      throw new InputError("Invalid external pool provider");
  }
}

async function getBalancerPoolState(poolTokenAddress: string) {
  const supportedBalancerPools = {
    ACXwstETH: {
      id: "0x36be1e97ea98ab43b4debf92742517266f5731a3000200000000000000000466",
      address: "0x32296969ef14eb0c6d29669c550d4a0449130230",
    },
  };

  const config = {
    network: {
      ...BALANCER_NETWORK_CONFIG[HUB_POOL_CHAIN_ID as 1 | 5],
      pools: {
        ...BALANCER_NETWORK_CONFIG[HUB_POOL_CHAIN_ID as 1 | 5].pools,
        ...supportedBalancerPools,
      },
    },
    rpcUrl: infuraProvider(HUB_POOL_CHAIN_ID).connection.url,
  };
  const balancer = new BalancerSDK(config);

  const pool = await balancer.pools.findBy("address", poolTokenAddress);

  if (!pool) {
    throw new InputError(
      `Balancer pool with address ${poolTokenAddress} not found`
    );
  }

  const apr = await balancer.pools.apr(pool);

  return {
    estimatedApy: Number(apr.max / 1000).toFixed(2),
    exchangeRateCurrent: utils.parseEther("1").toString(), // 1:1 because we don't need to handle underlying tokens on FE
  };
}
