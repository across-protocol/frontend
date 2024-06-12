import { AcceleratingDistributor__factory } from "@across-protocol/across-token/dist/typechain";
import {
  ERC20__factory,
  HubPool__factory,
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts/dist/typechain";
import * as sdk from "@across-protocol/sdk";
import {
  BALANCER_NETWORK_CONFIG,
  BalancerSDK,
  BalancerNetworkConfig,
} from "@balancer-labs/sdk";
import { Log, Logging } from "@google-cloud/logging";
import axios from "axios";
import { BigNumber, ethers, providers, utils } from "ethers";
import { StructError, define } from "superstruct";

import enabledMainnetRoutesAsJson from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import enabledSepoliaRoutesAsJson from "../src/data/routes_11155111_0x14224e63716afAcE30C9a417E0542281869f7d9e.json";

import {
  MINIMAL_BALANCER_V2_POOL_ABI,
  MINIMAL_BALANCER_V2_VAULT_ABI,
  MINIMAL_MULTICALL3_ABI,
} from "./_abis";

import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { VercelResponse } from "@vercel/node";
import {
  CHAIN_IDs,
  MULTICALL3_ADDRESS,
  DEFI_LLAMA_POOL_LOOKUP,
  EXTERNAL_POOL_TOKEN_EXCHANGE_RATE,
  SECONDS_PER_YEAR,
  TOKEN_SYMBOLS_MAP,
  maxRelayFeePct,
  relayerFeeCapitalCostConfig,
  BLOCK_TAG_LAG,
  defaultRelayerAddressOverride,
  defaultRelayerAddressOverridePerToken,
  disabledL1Tokens,
  DEFAULT_LIMITS_BUFFER_MULTIPLIERS,
} from "./_constants";
import { PoolStateResult } from "./_types";

type LoggingUtility = sdk.relayFeeCalculator.Logger;

const {
  REACT_APP_HUBPOOL_CHAINID,
  REACT_APP_PUBLIC_INFURA_ID,
  REACT_APP_COINGECKO_PRO_API_KEY,
  GOOGLE_SERVICE_ACCOUNT: _GOOGLE_SERVICE_ACCOUNT,
  VERCEL_ENV,
  GAS_MARKUP,
  DISABLE_DEBUG_LOGS,
} = process.env;

const GOOGLE_SERVICE_ACCOUNT = _GOOGLE_SERVICE_ACCOUNT
  ? JSON.parse(_GOOGLE_SERVICE_ACCOUNT)
  : {};

export const gasMarkup = GAS_MARKUP ? JSON.parse(GAS_MARKUP) : {};
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
      return `http://127.0.0.1:3000`;
  }
};

export const isBridgedUsdc = (tokenSymbol: string) => {
  return ["USDC.e", "USDbC"].includes(tokenSymbol);
};

export const validateChainAndTokenParams = (
  queryParams: Partial<{
    token: string;
    inputToken: string;
    outputToken: string;
    originChainId: string;
    destinationChainId: string;
  }>
) => {
  let {
    token,
    inputToken: inputTokenAddress,
    outputToken: outputTokenAddress,
    originChainId,
    destinationChainId: _destinationChainId,
  } = queryParams;

  if (!_destinationChainId) {
    throw new InputError("Query param 'destinationChainId' must be provided");
  }

  if (originChainId === _destinationChainId) {
    throw new InputError("Origin and destination chains cannot be the same");
  }

  if (!token && (!inputTokenAddress || !outputTokenAddress)) {
    throw new InputError(
      "Query param 'token' or 'inputToken' and 'outputToken' must be provided"
    );
  }

  const destinationChainId = Number(_destinationChainId);
  inputTokenAddress = _getAddressOrThrowInputError(
    (token || inputTokenAddress) as string,
    token ? "token" : "inputToken"
  );
  outputTokenAddress = outputTokenAddress
    ? _getAddressOrThrowInputError(outputTokenAddress, "outputToken")
    : undefined;

  const { l1Token, outputToken, inputToken, resolvedOriginChainId } =
    getRouteDetails(
      inputTokenAddress,
      destinationChainId,
      originChainId ? Number(originChainId) : undefined,
      outputTokenAddress
    );

  if (
    disabledL1Tokens.includes(l1Token.address.toLowerCase()) ||
    !isRouteEnabled(
      resolvedOriginChainId,
      destinationChainId,
      inputToken.address,
      outputToken.address
    )
  ) {
    throw new InputError(`Route is not enabled.`);
  }

  return {
    l1Token,
    inputToken,
    outputToken,
    destinationChainId,
    resolvedOriginChainId,
  };
};

/**
 * Utility function to resolve route details based on given `inputTokenAddress` and `destinationChainId`.
 * The optional parameter `originChainId` can be omitted if the `inputTokenAddress` is unique across all
 * chains. If the `inputTokenAddress` is not unique across all chains, the `originChainId` must be
 * provided to resolve the correct token details.
 * @param inputTokenAddress The token address to resolve details for.
 * @param destinationChainId The destination chain id of the route.
 * @param originChainId Optional if the `inputTokenAddress` is unique across all chains. Required if not.
 * @param outputTokenAddress Optional output token address.
 * @returns Token details of route and additional information, such as the inferred origin chain id, L1
 * token address and the input/output token addresses.
 */
export const getRouteDetails = (
  inputTokenAddress: string,
  destinationChainId: number,
  originChainId?: number,
  outputTokenAddress?: string
) => {
  const inputToken = getTokenByAddress(inputTokenAddress, originChainId);

  if (!inputToken) {
    throw new InputError(
      originChainId
        ? "Unsupported token on given origin chain"
        : "Unsupported token address"
    );
  }

  const isInputNativeUsdc = inputToken.symbol === "USDC";
  const l1TokenAddress =
    isBridgedUsdc(inputToken.symbol) || isInputNativeUsdc
      ? TOKEN_SYMBOLS_MAP.USDC.addresses[HUB_POOL_CHAIN_ID]
      : inputToken.addresses[HUB_POOL_CHAIN_ID];
  const l1Token =
    isBridgedUsdc(inputToken.symbol) || isInputNativeUsdc
      ? TOKEN_SYMBOLS_MAP.USDC
      : getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);

  if (!l1Token) {
    throw new InputError("No L1 token found for given input token address");
  }

  outputTokenAddress ??= inputToken.addresses[destinationChainId];

  const outputToken = outputTokenAddress
    ? getTokenByAddress(outputTokenAddress, destinationChainId)
    : undefined;

  if (!outputToken) {
    throw new InputError(
      "Unsupported token address on given destination chain"
    );
  }

  const possibleOriginChainIds = originChainId
    ? [originChainId]
    : _getChainIdsOfToken(inputTokenAddress, inputToken);

  if (possibleOriginChainIds.length === 0) {
    throw new InputError("Unsupported token address");
  }

  if (possibleOriginChainIds.length > 1) {
    throw new InputError(
      "More than one route is enabled for the provided inputs causing ambiguity. Please specify the originChainId."
    );
  }

  const resolvedOriginChainId = possibleOriginChainIds[0];

  return {
    inputToken: {
      ...inputToken,
      symbol: isBridgedUsdc(inputToken.symbol)
        ? _getBridgedUsdcTokenSymbol(inputToken.symbol, resolvedOriginChainId)
        : inputToken.symbol,
      address: inputToken.addresses[resolvedOriginChainId],
    },
    outputToken: {
      ...outputToken,
      symbol: isBridgedUsdc(outputToken.symbol)
        ? _getBridgedUsdcTokenSymbol(outputToken.symbol, destinationChainId)
        : outputToken.symbol,
      address: outputToken.addresses[destinationChainId],
    },
    l1Token: {
      ...l1Token,
      address: l1TokenAddress,
    },
    resolvedOriginChainId,
  };
};

export const getTokenByAddress = (tokenAddress: string, chainId?: number) => {
  const matches =
    Object.entries(TOKEN_SYMBOLS_MAP).filter(([_symbol, { addresses }]) =>
      chainId
        ? addresses[chainId]?.toLowerCase() === tokenAddress.toLowerCase()
        : Object.values(addresses).some(
            (address) => address.toLowerCase() === tokenAddress.toLowerCase()
          )
    ) || [];

  if (matches.length === 0) {
    return undefined;
  }

  if (matches.length > 1) {
    const nativeUsdc = matches.find(([symbol]) => symbol === "USDC");
    if (chainId === HUB_POOL_CHAIN_ID && nativeUsdc) {
      return nativeUsdc[1];
    }
  }

  return matches[0][1];
};

const _getChainIdsOfToken = (
  tokenAddress: string,
  token: typeof TOKEN_SYMBOLS_MAP[keyof typeof TOKEN_SYMBOLS_MAP]
) => {
  const chainIds = Object.entries(token.addresses).filter(
    ([_, address]) => address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return chainIds.map(([chainId]) => Number(chainId));
};

const _getBridgedUsdcTokenSymbol = (tokenSymbol: string, chainId: number) => {
  return tokenSymbol === "USDC.e" && chainId === CHAIN_IDs.BASE
    ? "USDbC"
    : tokenSymbol;
};

const _getAddressOrThrowInputError = (address: string, paramName: string) => {
  try {
    return ethers.utils.getAddress(address);
  } catch (err) {
    throw new InputError(`Invalid address provided for '${paramName}'`);
  }
};

export class InputError extends Error {}

export const getHubPool = (provider: providers.Provider) => {
  return HubPool__factory.connect(ENABLED_ROUTES.hubPoolAddress, provider);
};

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
  const url = process.env[`REACT_APP_CHAIN_${chainId}_PROVIDER_URL`];
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
    chainId: chainId,
    hubPoolAddress: ENABLED_ROUTES.hubPoolAddress,
    wethAddress: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.MAINNET],
    configStoreAddress: ENABLED_ROUTES.acrossConfigStoreAddress,
    acceleratingDistributorAddress:
      ENABLED_ROUTES.acceleratingDistributorAddress,
    merkleDistributorAddress: ENABLED_ROUTES.merkleDistributorAddress,
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

export const getGasMarkup = (chainId: string | number) => {
  return gasMarkup[chainId] ?? DEFAULT_GAS_MARKUP;
};

/**
 * Retrieves an isntance of the Across SDK RelayFeeCalculator
 * @param destinationChainId The destination chain that a bridge operation will transfer to
 * @returns An instance of the `RelayFeeCalculator` for the specific chain specified by `destinationChainId`
 */
export const getRelayerFeeCalculator = (
  destinationChainId: number,
  overrides: Partial<{
    spokePoolAddress: string;
    relayerAddress: string;
  }> = {}
) => {
  const queries = sdk.relayFeeCalculator.QueryBase__factory.create(
    destinationChainId,
    getProvider(destinationChainId),
    undefined,
    overrides.spokePoolAddress,
    overrides.relayerAddress,
    REACT_APP_COINGECKO_PRO_API_KEY,
    getLogger(),
    getGasMarkup(destinationChainId)
  );
  const relayerFeeCalculatorConfig = {
    feeLimitPercent: maxRelayFeePct * 100,
    queries,
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
  const symbol = Object.entries(TOKEN_SYMBOLS_MAP).find(
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
 * @param inputToken A valid input token address
 * @param outputToken A valid output token address
 * @param amount  The amount of funds that are requesting to be transferred
 * @param originChainId The origin chain that this token will be transferred from
 * @param destinationChainId The destination chain that this token will be transferred to
 * @param recipientAddress The address that will receive the transferred funds
 * @param tokenPrice An optional overred price to prevent the SDK from creating its own call
 * @param message An optional message to include in the transfer
 * @param relayerAddress An optional relayer address to use for the transfer
 * @returns The a promise to the relayer fee for the given `amount` of transferring `l1Token` to `destinationChainId`
 */
export const getRelayerFeeDetails = async (
  inputToken: string,
  outputToken: string,
  amount: sdk.utils.BigNumberish,
  originChainId: number,
  destinationChainId: number,
  recipientAddress: string,
  tokenPrice?: number,
  message?: string,
  relayerAddress?: string
): Promise<sdk.relayFeeCalculator.RelayerFeeDetails> => {
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId, {
    relayerAddress,
  });
  try {
    return await relayFeeCalculator.relayerFeeDetails(
      {
        inputAmount: sdk.utils.toBN(amount),
        outputAmount: sdk.utils.toBN(amount),
        depositId: sdk.utils.bnUint32Max.toNumber(),
        depositor: recipientAddress,
        recipient: recipientAddress,
        destinationChainId,
        originChainId,
        quoteTimestamp: sdk.utils.getCurrentTime() - 60, // Set the quote timestamp to 60 seconds ago ~ 1 ETH block
        inputToken,
        outputToken,
        fillDeadline: sdk.utils.bnUint32Max.toNumber(), // Defined as `INFINITE_FILL_DEADLINE` in SpokePool.sol
        exclusiveRelayer: sdk.constants.ZERO_ADDRESS,
        exclusivityDeadline: 0, // Defined as ZERO in SpokePool.sol
        message: message ?? sdk.constants.EMPTY_MESSAGE,
      },
      amount,
      sdk.utils.isMessageEmpty(message),
      relayerAddress,
      tokenPrice
    );
  } catch (err: unknown) {
    const reason = resolveEthersError(err);
    throw new InputError(`Relayer fill simulation failed - ${reason}`);
  }
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

/**
 * Creates an HTTP call to the `/api/limits` endpoint to resolve limits for a given token/route.
 * @param inputToken The input token address
 * @param outputToken The output token address
 * @param originChainId The origin chain id
 * @param destinationChainId The destination chain id
 */
export const getCachedLimits = async (
  inputToken: string,
  outputToken: string,
  originChainId: number,
  destinationChainId: number
): Promise<{
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
  recommendedDepositInstant: string;
}> => {
  return (
    await axios(`${resolveVercelEndpoint()}/api/limits`, {
      params: {
        inputToken,
        outputToken,
        originChainId,
        destinationChainId,
      },
    })
  ).data;
};

export const providerCache: Record<string, StaticJsonRpcProvider> = {};

/**
 * Generates a relevant provider for the given input chainId
 * @param _chainId A valid chain identifier where an AcrossV2 contract is deployed
 * @returns A provider object to query the requested blockchain
 */
export const getProvider = (
  _chainId: number
): providers.StaticJsonRpcProvider => {
  const chainId = _chainId.toString();
  if (!providerCache[chainId]) {
    const override = overrideProvider(chainId);
    if (override) {
      providerCache[chainId] = override;
    } else {
      providerCache[chainId] = infuraProvider(_chainId);
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

export const getSpokePoolAddress = (chainId: number): string => {
  switch (chainId) {
    case CHAIN_IDs.MODE_SEPOLIA:
      return "0xbd886FC0725Cc459b55BbFEb3E4278610331f83b";
    case CHAIN_IDs.MODE:
      return "0x3baD7AD0728f9917d1Bf08af5782dCbD516cDd96s";
    default:
      return sdk.utils.getDeployedAddress("SpokePool", chainId);
  }
};

/**
 * Determines if a given route is enabled to support an AcrossV2 bridge
 * @param fromChainId The chain id of the origin bridge action
 * @param toChainId The chain id of the destination bridge action.
 * @param fromToken The originating token address. Note: is a valid ERC-20 address
 * @param toToken The destination token address. Note: is a valid ERC-20 address
 * @returns A boolean representing if a route with these parameters is available
 */
export const isRouteEnabled = (
  fromChainId: number,
  toChainId: number,
  fromToken: string,
  toToken: string
): boolean => {
  const enabled = ENABLED_ROUTES.routes.find(
    ({ fromTokenAddress, toTokenAddress, fromChain, toChain }) =>
      fromChainId === fromChain &&
      toChainId === toChain &&
      fromToken.toLowerCase() === fromTokenAddress.toLowerCase() &&
      toToken.toLowerCase() === toTokenAddress.toLowerCase()
  );
  return !!enabled;
};

/**
 * Resolves the balance of a given ERC20 token at a provided address. If no token is provided, the balance of the
 * native currency will be returned.
 * @param chainId The blockchain Id to query against
 * @param account A valid Web3 wallet address
 * @param token The valid ERC20 token address on the given `chainId`.
 * @returns A promise that resolves to the BigNumber of the balance
 */
export const getBalance = (
  chainId: string | number,
  account: string,
  token: string
): Promise<BigNumber> => {
  return sdk.utils.getTokenBalance(
    account,
    token,
    getProvider(Number(chainId)),
    BLOCK_TAG_LAG
  );
};

/**
 * Resolves the cached balance of a given ERC20 token at a provided address. If no token is provided, the balance of the
 * native currency will be returned.
 * @param chainId The blockchain Id to query against
 * @param account A valid Web3 wallet address
 * @param token The valid ERC20 token address on the given `chainId`.
 * @returns A promise that resolves to the BigNumber of the balance
 */
export const getCachedTokenBalance = async (
  chainId: string | number,
  account: string,
  token: string
): Promise<BigNumber> => {
  // Make the request to the vercel API.
  const response = await axios.get<{ balance: string }>(
    `${resolveVercelEndpoint()}/api/account-balance`,
    {
      params: {
        chainId,
        account,
        token,
      },
    }
  );
  // Return the balance
  return BigNumber.from(response.data.balance);
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

export function resolveEthersError(err: unknown): string {
  // prettier-ignore
  return sdk.typeguards.isEthersError(err)
    ? `${err.reason}: ${err.code}`
    : sdk.typeguards.isError(err)
      ? err.message
      : "unknown error";
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

export function positiveFloatStr(maxValue?: number) {
  return define<string>("positiveFloatStr", (value) => {
    return Number(value) >= 0 && (maxValue ? Number(value) <= maxValue : true);
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
  const isACX = TOKEN_SYMBOLS_MAP.ACX.addresses[1] === l1TokenAddress;

  if (isACX) {
    return "https://across.to/logo-small.png";
  }

  return `https://github.com/trustwallet/assets/blob/master/blockchains/ethereum/assets/${l1TokenAddress}/logo.png?raw=true`;
}

export async function getPoolState(
  tokenAddress: string,
  externalPoolProvider?: string
): Promise<PoolStateResult> {
  const resolvedAddress = ethers.utils.getAddress(tokenAddress);
  if (externalPoolProvider === "balancer") {
    return getExternalPoolState(tokenAddress, externalPoolProvider);
  } else if (DEFI_LLAMA_POOL_LOOKUP[resolvedAddress] !== undefined) {
    return getDefiLlamaPoolState(tokenAddress);
  } else {
    return getAcrossPoolState(tokenAddress);
  }
}

export async function getDefiLlamaPoolState(
  tokenAddress: string
): Promise<PoolStateResult> {
  const UUID = DEFI_LLAMA_POOL_LOOKUP[ethers.utils.getAddress(tokenAddress)];
  const url = `https://yields.llama.fi/chart/${UUID}`;
  const response = await axios.get<{
    status: string;
    data: { timestamp: string; apy: number; tvlUsd: number }[];
  }>(url);
  if (response.data.status !== "success") {
    throw new Error("Failed to fetch pool state");
  }
  const data = response.data.data;
  const lastElement = data[data.length - 1];
  return {
    estimatedApy: (lastElement.apy / 100).toFixed(4),
    exchangeRateCurrent: EXTERNAL_POOL_TOKEN_EXCHANGE_RATE.toString(),
    totalPoolSize: lastElement.tvlUsd.toFixed(2),
  };
}

export async function getAcrossPoolState(tokenAddress: string) {
  const hubPoolClient = getHubPoolClient();
  await hubPoolClient.updatePool(tokenAddress);
  return hubPoolClient.getPoolState(tokenAddress);
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
  const supportedBalancerPoolsMap = {
    [CHAIN_IDs.MAINNET]: {
      "50wstETH-50ACX": {
        id: "0x36be1e97ea98ab43b4debf92742517266f5731a3000200000000000000000466",
        address: "0x36Be1E97eA98AB43b4dEBf92742517266F5731a3",
      },
    },
    [CHAIN_IDs.SEPOLIA]: {},
  };

  const defaultNetworkConfig = BALANCER_NETWORK_CONFIG[HUB_POOL_CHAIN_ID];
  const config = {
    network: {
      ...defaultNetworkConfig,
      pools: {
        ...defaultNetworkConfig.pools,
        ...supportedBalancerPoolsMap[HUB_POOL_CHAIN_ID],
      },
    } as BalancerNetworkConfig,
    rpcUrl: getProvider(HUB_POOL_CHAIN_ID).connection.url,
    coingecko: {
      coingeckoApiKey: REACT_APP_COINGECKO_PRO_API_KEY!,
    },
  };

  const poolEntry = Object.entries(
    supportedBalancerPoolsMap[HUB_POOL_CHAIN_ID]
  ).find(
    ([_, { address }]) =>
      address.toLowerCase() === poolTokenAddress.toLowerCase()
  );

  if (!poolEntry) {
    throw new InputError(
      `Balancer pool with address ${poolTokenAddress} not found`
    );
  }

  const poolId = poolEntry[1].id as string;

  const balancer = new BalancerSDK({
    ...config,
    subgraphQuery: {
      args: {
        where: {
          id: {
            // Note: This ensures that only a single pool is queried which
            // improves performance significantly.
            eq: poolId,
          },
        },
      },
      attrs: {},
    },
  });

  const pool = await balancer.pools.find(poolId);

  if (!pool) {
    throw new InputError(
      `Balancer pool with address ${poolTokenAddress} not found`
    );
  }

  const apr = await balancer.pools.apr(pool);

  // We want to include the swap fees & the underlying token
  // APRs in the APY calculation.
  const apyEstimated = (apr.swapFees + apr.tokenAprs.total) / 10_000;

  return {
    // The Balancer SDK returns percentages as follows:
    // 23% (0.23) as 2300
    // 2.3% (0.023) as 230
    // etc. So we divide by 10_000 to get the actual percentage.
    //
    // Additionally, we receive a potential range of APRs, so we take the average.
    estimatedApy: apyEstimated.toFixed(3),
    exchangeRateCurrent: EXTERNAL_POOL_TOKEN_EXCHANGE_RATE.toString(),
    totalPoolSize: pool.totalShares,
  };
}

export async function fetchStakingPool(
  underlyingToken: {
    address: string;
    symbol: string;
    decimals: number;
  },
  externalPoolProvider?: string
) {
  const poolUnderlyingTokenAddress = underlyingToken.address;
  const provider = getProvider(HUB_POOL_CHAIN_ID);

  const hubPool = HubPool__factory.connect(
    ENABLED_ROUTES.hubPoolAddress,
    provider
  );
  const acceleratingDistributor = AcceleratingDistributor__factory.connect(
    ENABLED_ROUTES.acceleratingDistributorAddress,
    provider
  );

  const lpTokenAddress = externalPoolProvider
    ? poolUnderlyingTokenAddress
    : (await hubPool.pooledTokens(poolUnderlyingTokenAddress)).lpToken;

  const [acrossTokenAddress, tokenUSDExchangeRate] = await Promise.all([
    acceleratingDistributor.rewardToken(),
    getCachedTokenPrice(poolUnderlyingTokenAddress, "usd"),
  ]);
  const acxPriceInUSD = await getCachedTokenPrice(acrossTokenAddress, "usd");

  const lpTokenERC20 = ERC20__factory.connect(lpTokenAddress, provider);

  const [
    { enabled: poolEnabled, maxMultiplier, baseEmissionRate, cumulativeStaked },
    lpTokenDecimalCount,
    lpTokenSymbolName,
    liquidityPoolState,
  ] = await Promise.all([
    acceleratingDistributor.stakingTokens(lpTokenAddress),
    lpTokenERC20.decimals(),
    lpTokenERC20.symbol(),
    getPoolState(poolUnderlyingTokenAddress, externalPoolProvider),
  ]);

  const {
    estimatedApy: estimatedApyFromQuery,
    exchangeRateCurrent: lpExchangeRateToToken,
    totalPoolSize,
  } = liquidityPoolState;

  const lpExchangeRateToUSD = utils
    .parseUnits(tokenUSDExchangeRate.toString())
    .mul(lpExchangeRateToToken)
    .div(sdk.utils.fixedPointAdjustment);

  const convertLPValueToUsd = (lpAmount: BigNumber) =>
    BigNumber.from(lpExchangeRateToUSD)
      .mul(ConvertDecimals(lpTokenDecimalCount, 18)(lpAmount))
      .div(sdk.utils.fixedPointAdjustment);

  const usdCumulativeStakedValue = convertLPValueToUsd(cumulativeStaked);
  const usdTotalPoolSize = BigNumber.from(totalPoolSize)
    .mul(utils.parseUnits(tokenUSDExchangeRate.toString()))
    .div(sdk.utils.fixedPointAdjustment);

  const baseRewardsApy = getBaseRewardsApr(
    baseEmissionRate
      .mul(SECONDS_PER_YEAR)
      .mul(utils.parseUnits(acxPriceInUSD.toString()))
      .div(sdk.utils.fixedPointAdjustment),
    usdCumulativeStakedValue
  );
  const poolApy = utils.parseEther(estimatedApyFromQuery);
  const maxApy = poolApy.add(
    baseRewardsApy.mul(maxMultiplier).div(sdk.utils.fixedPointAdjustment)
  );
  const minApy = poolApy.add(baseRewardsApy);
  const rewardsApy = baseRewardsApy
    .mul(utils.parseEther("1"))
    .div(sdk.utils.fixedPointAdjustment);
  const totalApy = poolApy.add(rewardsApy);

  return {
    hubPoolAddress: hubPool.address,
    acceleratingDistributorAddress: acceleratingDistributor.address,
    underlyingToken,
    lpTokenAddress,
    poolEnabled,
    lpTokenSymbolName,
    lpTokenDecimalCount: lpTokenDecimalCount,
    apyData: {
      poolApy,
      maxApy,
      minApy,
      totalApy,
      baseRewardsApy,
      rewardsApy,
    },
    usdTotalPoolSize,
    totalPoolSize,
  };
}

// Copied from @uma/common
export const ConvertDecimals = (fromDecimals: number, toDecimals: number) => {
  // amount: string, BN, number - integer amount in fromDecimals smallest unit that want to convert toDecimals
  // returns: string with toDecimals in smallest unit
  return (amount: BigNumber): string => {
    amount = BigNumber.from(amount);
    if (amount.isZero()) return amount.toString();
    const diff = fromDecimals - toDecimals;
    if (diff === 0) return amount.toString();
    if (diff > 0) return amount.div(BigNumber.from("10").pow(diff)).toString();
    return amount.mul(BigNumber.from("10").pow(-1 * diff)).toString();
  };
};

export function getBaseRewardsApr(
  rewardsPerYearInUSD: BigNumber,
  totalStakedInUSD: BigNumber
) {
  if (totalStakedInUSD.isZero()) {
    totalStakedInUSD = utils.parseEther("1");
  }

  return rewardsPerYearInUSD
    .mul(sdk.utils.fixedPointAdjustment)
    .div(totalStakedInUSD);
}

/**
 * Makes a series of read calls via multicall3 (so they only hit the provider once).
 * @param provider Provider to use for the calls.
 * @param calls the calls to make via multicall3. Each call includes a contract, function name, and args, so that
 * this function can encode them correctly.
 * @param overrides Overrides to use for the multicall3 call.
 * @returns An array of the decoded results in the same order that they were passed in.
 */
export async function callViaMulticall3(
  provider: ethers.providers.JsonRpcProvider,
  calls: {
    contract: ethers.Contract;
    functionName: string;
    args?: any[];
  }[],
  overrides: ethers.CallOverrides = {}
): Promise<ethers.utils.Result[]> {
  const multicall3 = new ethers.Contract(
    MULTICALL3_ADDRESS,
    MINIMAL_MULTICALL3_ABI,
    provider
  );
  const inputs = calls.map(({ contract, functionName, args }) => ({
    target: contract.address,
    callData: contract.interface.encodeFunctionData(functionName, args),
  }));

  const [, results] = await (multicall3.callStatic.aggregate(
    inputs,
    overrides
  ) as Promise<[BigNumber, string[]]>);
  return results.map((result, i) =>
    calls[i].contract.interface.decodeFunctionResult(
      calls[i].functionName,
      result
    )
  );
}

/**
 * This gets a balancer v2 token price by querying the vault contract for the tokens and balances, and then
 * querying coingecko for the prices of those tokens.
 * @param tokenAddress The address of the balancer v2 token.
 * @param chainId The chain id where the token exists.
 */
export async function getBalancerV2TokenPrice(
  tokenAddress: string,
  chainId = 1
) {
  const provider = getProvider(chainId);
  const pool = new ethers.Contract(
    tokenAddress,
    MINIMAL_BALANCER_V2_POOL_ABI,
    provider
  );

  const [[vaultAddress], [poolId], [totalSupply]] = await callViaMulticall3(
    provider,
    [
      {
        contract: pool,
        functionName: "getVault",
      },
      {
        contract: pool,
        functionName: "getPoolId",
      },
      {
        contract: pool,
        functionName: "totalSupply",
      },
    ]
  );

  const vault = new ethers.Contract(
    vaultAddress,
    MINIMAL_BALANCER_V2_VAULT_ABI,
    provider
  );

  const { tokens, balances } = (await vault.getPoolTokens(poolId)) as {
    tokens: string[];
    balances: BigNumber[];
  };

  const tokenValues = await Promise.all(
    tokens.map(async (token: string, i: number): Promise<number> => {
      const tokenContract = ERC20__factory.connect(token, provider);
      const [price, decimals] = await Promise.all([
        getCachedTokenPrice(token, "usd"),
        tokenContract.decimals(),
      ]);
      const balance = parseFloat(
        ethers.utils.formatUnits(balances[i], decimals)
      );
      return balance * price;
    })
  );

  const totalValue = tokenValues.reduce((a, b) => a + b, 0);

  // Balancer v2 tokens have 18 decimals.
  const floatTotalSupply = parseFloat(
    ethers.utils.formatUnits(totalSupply, 18)
  );

  return Number((totalValue / floatTotalSupply).toFixed(18));
}

/**
 * Returns the EOA that will serve as the default relayer address
 * @param destinationChainId The destination chain that a bridge operation will transfer to
 * @param symbol A valid token symbol
 * @returns A valid EOA address
 */
export function getDefaultRelayerAddress(
  destinationChainId: number,
  symbol?: string
) {
  // All symbols are uppercase in this record.
  const overrideForToken = symbol
    ? defaultRelayerAddressOverridePerToken[symbol.toUpperCase()]
    : undefined;
  if (overrideForToken?.destinationChains.includes(destinationChainId)) {
    return overrideForToken.relayer;
  } else {
    return (
      defaultRelayerAddressOverride ||
      sdk.constants.DEFAULT_SIMULATED_RELAYER_ADDRESS
    );
  }
}

/**
 * Performs the needed function calls to return a Vercel Response
 * @param response The response client provided by Vercel
 * @param body A payload in JSON format to send to the client
 * @param statusCode The status code - defaults to 200
 * @param cacheSeconds The cache time in non-negative whole seconds
 * @param staleWhileRevalidateSeconds The stale while revalidate time in non-negative whole seconds
 * @returns The response object
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
 * @see https://datatracker.ietf.org/doc/html/rfc7234
 * @note Be careful to not set anything negative please. The comment in the fn explains why
 */
export function sendResponse(
  response: VercelResponse,
  body: Record<string, unknown>,
  statusCode: number,
  cacheSeconds: number,
  staleWhileRevalidateSeconds: number
) {
  // Invalid (non-positive/non-integer) values will be considered undefined per RFC-7234.
  // Most browsers will consider these invalid and will request fresh data.
  response.setHeader(
    "Cache-Control",
    `s-maxage=${cacheSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
  );
  return response.status(statusCode).json(body);
}

export function isSwapRouteEnabled({
  originChainId,
  destinationChainId,
  acrossInputTokenSymbol,
  acrossOutputTokenSymbol,
  swapTokenAddress,
}: {
  originChainId: number;
  destinationChainId: number;
  acrossInputTokenSymbol: string;
  acrossOutputTokenSymbol: string;
  swapTokenAddress: string;
}) {
  const swapRoute = ENABLED_ROUTES.swapRoutes.find((route) => {
    return (
      route.fromChain === originChainId &&
      route.toChain === destinationChainId &&
      route.fromTokenSymbol === acrossInputTokenSymbol &&
      route.toTokenSymbol === acrossOutputTokenSymbol &&
      route.swapTokenAddress.toLowerCase() === swapTokenAddress.toLowerCase()
    );
  });
  return !!swapRoute;
}

export function getLimitsBufferMultipliers(
  symbol: string,
  fromChainId: number,
  toChainId: number
) {
  return {
    recommendedDepositInstant: getRecommendedDepositInstantMultiplier(
      symbol,
      fromChainId,
      toChainId
    ),
    depositInstant: getDepositInstantMultiplier(symbol, fromChainId, toChainId),
    depositShortDelay: getDepositShortDelayMultiplier(
      symbol,
      fromChainId,
      toChainId
    ),
  };
}

/**
 * Returns a value that will be multiplied by `maxDepositInstant` to
 * calculate the recommended deposit instant limit.
 * @param symbol The token symbol to retrieve the multiplier for.
 * @param fromChainId The chain ID of the origin chain.
 * @param toChainId The chain ID of the destination chain.
 */
export const getRecommendedDepositInstantMultiplier =
  _makeLimitsBufferMultiplierGetter(
    "RECOMMENDED_DEPOSIT_INSTANT_MULTIPLIER",
    DEFAULT_LIMITS_BUFFER_MULTIPLIERS.recommendedDepositInstant
  );

/**
 * Returns a value that will be multiplied by `maxDepositInstant` to
 * calculate a buffered value instant deposit limit.
 * @param symbol The token symbol to retrieve the multiplier for.
 * @param fromChainId The chain ID of the origin chain.
 * @param toChainId The chain ID of the destination chain.
 */
export const getDepositInstantMultiplier = _makeLimitsBufferMultiplierGetter(
  "DEPOSIT_INSTANT_BUFFER_MULTIPLIER",
  DEFAULT_LIMITS_BUFFER_MULTIPLIERS.depositInstant
);

/**
 * Returns a value that will be multiplied by `maxDepositShortDelay` to
 * calculate a buffered value short delay deposit limit.
 * @param symbol The token symbol to retrieve the multiplier for.
 * @param fromChainId The chain ID of the origin chain.
 * @param toChainId The chain ID of the destination chain.
 */
export const getDepositShortDelayMultiplier = _makeLimitsBufferMultiplierGetter(
  "DEPOSIT_SHORT_DELAY_BUFFER_MULTIPLIER",
  DEFAULT_LIMITS_BUFFER_MULTIPLIERS.depositShortDelay
);

function _makeLimitsBufferMultiplierGetter(
  envVarBase: string,
  defaultLimitsBufferMultiplier: string
) {
  return (symbol: string, fromChainId: number, toChainId: number) => {
    return ethers.utils.parseEther(
      [
        `${envVarBase}_${symbol}_${fromChainId}_${toChainId}`,
        `${envVarBase}_${symbol}_${fromChainId}`,
        `${envVarBase}_${symbol}`,
      ]
        .map((key) => process.env[key])
        .find((value) => value !== undefined) || defaultLimitsBufferMultiplier
    );
  };
}
