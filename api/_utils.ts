import { AcceleratingDistributor__factory } from "@across-protocol/across-token/dist/typechain";
import {
  ERC20__factory,
  HubPool__factory,
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts/dist/typechain";
import acrossDeployments from "@across-protocol/contracts/dist/deployments/deployments.json";
import * as sdk from "@across-protocol/sdk";
import {
  BALANCER_NETWORK_CONFIG,
  BalancerSDK,
  BalancerNetworkConfig,
  Multicall3,
} from "@balancer-labs/sdk";
import axios from "axios";
import {
  BigNumber,
  BigNumberish,
  ethers,
  providers,
  utils,
  Signer,
} from "ethers";
import {
  assert,
  coerce,
  create,
  define,
  Infer,
  integer,
  min,
  string,
  Struct,
} from "superstruct";

import enabledMainnetRoutesAsJson from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import enabledSepoliaRoutesAsJson from "../src/data/routes_11155111_0x14224e63716afAcE30C9a417E0542281869f7d9e.json";
import rpcProvidersJson from "../src/data/rpc-providers.json";

import {
  MINIMAL_BALANCER_V2_POOL_ABI,
  MINIMAL_BALANCER_V2_VAULT_ABI,
  MINIMAL_MULTICALL3_ABI,
} from "./_abis";
import { BatchAccountBalanceResponse } from "./batch-account-balance";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { VercelRequestQuery, VercelResponse } from "@vercel/node";
import {
  BLOCK_TAG_LAG,
  CHAIN_IDs,
  DEFAULT_LITE_CHAIN_USD_MAX_BALANCE,
  DEFAULT_LITE_CHAIN_USD_MAX_DEPOSIT,
  DEFI_LLAMA_POOL_LOOKUP,
  DOMAIN_CALLDATA_DELIMITER,
  EXTERNAL_POOL_TOKEN_EXCHANGE_RATE,
  MULTICALL3_ADDRESS,
  MULTICALL3_ADDRESS_OVERRIDES,
  SECONDS_PER_YEAR,
  TOKEN_SYMBOLS_MAP,
  defaultRelayerAddressOverride,
  disabledL1Tokens,
  graphAPIKey,
  maxRelayFeePct,
  relayerFeeCapitalCostConfig,
} from "./_constants";
import { PoolStateOfUser, PoolStateResult } from "./_types";
import {
  buildInternalCacheKey,
  getCachedValue,
  makeCacheGetterAndSetter,
} from "./_cache";
import {
  MissingParamError,
  InvalidParamError,
  RouteNotEnabledError,
} from "./_errors";

export { InputError, handleErrorCondition } from "./_errors";

type LoggingUtility = sdk.relayFeeCalculator.Logger;
type RpcProviderName = keyof typeof rpcProvidersJson.providers.urls;

const {
  REACT_APP_HUBPOOL_CHAINID,
  REACT_APP_PUBLIC_INFURA_ID,
  REACT_APP_COINGECKO_PRO_API_KEY,
  BASE_FEE_MARKUP,
  PRIORITY_FEE_MARKUP,
  OP_STACK_L1_DATA_FEE_MARKUP,
  VERCEL_ENV,
  LOG_LEVEL,
} = process.env;

export const baseFeeMarkup: {
  [chainId: string]: number;
} = JSON.parse(BASE_FEE_MARKUP || "{}");
export const priorityFeeMarkup: {
  [chainId: string]: number;
} = JSON.parse(PRIORITY_FEE_MARKUP || "{}");
export const opStackL1DataFeeMarkup: {
  [chainId: string]: number;
} = JSON.parse(OP_STACK_L1_DATA_FEE_MARKUP || "{}");
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

export const LogLevels = {
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0,
} as const;
// Singleton logger so we don't create multiple.
let logger: LoggingUtility;
/**
 * Resolves a logging utility to be used. This instance caches its responses
 * @returns A valid Logging utility that can be used throughout the runtime
 */
export const getLogger = (): LoggingUtility => {
  if (!logger) {
    const defaultLogLevel = VERCEL_ENV === "production" ? "ERROR" : "DEBUG";

    let logLevel =
      LOG_LEVEL && !Object.keys(LogLevels).includes(LOG_LEVEL)
        ? defaultLogLevel
        : (LOG_LEVEL as keyof typeof LogLevels);

    logger = {
      debug: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.DEBUG) {
          console.debug(args);
        }
      },
      info: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.INFO) {
          console.info(args);
        }
      },
      warn: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.WARN) {
          console.warn(args);
        }
      },
      error: (...args) => {
        if (LogLevels[logLevel] <= LogLevels.ERROR) {
          console.error(args);
        }
      },
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
    throw new MissingParamError({
      message: "Query param 'destinationChainId' must be provided",
    });
  }

  if (originChainId === _destinationChainId) {
    throw new InvalidParamError({
      message: "Origin and destination chains cannot be the same",
    });
  }

  if (!token && (!inputTokenAddress || !outputTokenAddress)) {
    throw new MissingParamError({
      message:
        "Query param 'token' or 'inputToken' and 'outputToken' must be provided",
    });
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
    throw new RouteNotEnabledError({
      message: "Route is not enabled.",
    });
  }

  return {
    l1Token,
    inputToken,
    outputToken,
    destinationChainId,
    resolvedOriginChainId,
  };
};

export const validateDepositMessage = async (
  recipient: string,
  destinationChainId: number,
  relayer: string,
  outputTokenAddress: string,
  amountInput: string,
  message: string
) => {
  if (!sdk.utils.isMessageEmpty(message)) {
    if (!ethers.utils.isHexString(message)) {
      throw new InvalidParamError({
        message: "Message must be a hex string",
        param: "message",
      });
    }
    if (message.length % 2 !== 0) {
      // Our message encoding is a hex string, so we need to check that the length is even.
      throw new InvalidParamError({
        message: "Message must be an even hex string",
        param: "message",
      });
    }
    const isRecipientAContract =
      getStaticIsContract(destinationChainId, recipient) ||
      (await isContractCache(destinationChainId, recipient).get());
    if (!isRecipientAContract) {
      throw new InvalidParamError({
        message: "Recipient must be a contract when a message is provided",
        param: "recipient",
      });
    } else {
      // If we're in this case, it's likely that we're going to have to simulate the execution of
      // a complex message handling from the specified relayer to the specified recipient by calling
      // the arbitrary function call `handleAcrossMessage` at the recipient. So that we can discern
      // the difference between an OUT_OF_FUNDS error in either the transfer or through the execution
      // of the `handleAcrossMessage` we will check that the balance of the relayer is sufficient to
      // support this deposit.
      const balanceOfToken = await getCachedTokenBalance(
        destinationChainId,
        relayer,
        outputTokenAddress
      );
      if (balanceOfToken.lt(amountInput)) {
        throw new InvalidParamError({
          message:
            `Relayer Address (${relayer}) doesn't have enough funds to support this deposit;` +
            ` for help, please reach out to https://discord.across.to`,
          param: "relayer",
        });
      }
    }
  }
};

function getStaticIsContract(chainId: number, address: string) {
  const deployedAcrossContract = Object.values(
    (
      acrossDeployments as {
        [chainId: number]: {
          [contractName: string]: {
            address: string;
          };
        };
      }
    )[chainId]
  ).find(
    (contract) => contract.address.toLowerCase() === address.toLowerCase()
  );
  return !!deployedAcrossContract;
}

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
    throw new InvalidParamError({
      message: originChainId
        ? "Unsupported token on given origin chain"
        : "Unsupported token address",
      param: "inputTokenAddress",
    });
  }

  const l1TokenAddress =
    TOKEN_SYMBOLS_MAP[inputToken.symbol as keyof typeof TOKEN_SYMBOLS_MAP]
      .addresses[HUB_POOL_CHAIN_ID];
  const l1Token = getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);

  if (!l1Token) {
    throw new InvalidParamError({
      message: "No L1 token found for given input token address",
      param: "inputTokenAddress",
    });
  }

  outputTokenAddress ??=
    inputToken.addresses[destinationChainId] ||
    l1Token.addresses[destinationChainId];

  const outputToken = outputTokenAddress
    ? getTokenByAddress(outputTokenAddress, destinationChainId)
    : undefined;

  if (!outputToken) {
    throw new InvalidParamError({
      message: "Unsupported token address on given destination chain",
      param: "outputTokenAddress",
    });
  }

  const possibleOriginChainIds = originChainId
    ? [originChainId]
    : _getChainIdsOfToken(inputTokenAddress, inputToken);

  if (possibleOriginChainIds.length === 0) {
    throw new InvalidParamError({
      message: "Unsupported token address",
      param: "inputTokenAddress",
    });
  }

  if (possibleOriginChainIds.length > 1) {
    throw new InvalidParamError({
      message:
        "More than one route is enabled for the provided inputs causing ambiguity. Please specify the originChainId.",
      param: "inputTokenAddress",
    });
  }

  const resolvedOriginChainId = possibleOriginChainIds[0];

  return {
    inputToken: {
      ...inputToken,
      symbol: sdk.utils.isBridgedUsdc(inputToken.symbol)
        ? _getBridgedUsdcTokenSymbol(inputToken.symbol, resolvedOriginChainId)
        : inputToken.symbol,
      address: utils.getAddress(inputToken.addresses[resolvedOriginChainId]),
    },
    outputToken: {
      ...outputToken,
      symbol: sdk.utils.isBridgedUsdc(outputToken.symbol)
        ? _getBridgedUsdcTokenSymbol(outputToken.symbol, destinationChainId)
        : outputToken.symbol,
      address: utils.getAddress(outputToken.addresses[destinationChainId]),
    },
    l1Token: {
      ...l1Token,
      address: l1TokenAddress,
    },
    resolvedOriginChainId,
  };
};

export const getTokenByAddress = (
  tokenAddress: string,
  chainId?: number
):
  | {
      decimals: number;
      symbol: string;
      name: string;
      addresses: Record<number, string>;
      coingeckoId: string;
    }
  | undefined => {
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
  token: Omit<
    (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP],
    "coingeckoId"
  >
) => {
  const chainIds = Object.entries(token.addresses).filter(
    ([_, address]) => address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return chainIds.map(([chainId]) => Number(chainId));
};

const _getBridgedUsdcTokenSymbol = (tokenSymbol: string, chainId: number) => {
  if (!sdk.utils.isBridgedUsdc(tokenSymbol)) {
    throw new Error(`Token ${tokenSymbol} is not a bridged USDC token`);
  }

  switch (chainId) {
    case CHAIN_IDs.BASE:
      return TOKEN_SYMBOLS_MAP.USDbC.symbol;
    case CHAIN_IDs.ZORA:
      return TOKEN_SYMBOLS_MAP.USDzC.symbol;
    default:
      return TOKEN_SYMBOLS_MAP["USDC.e"].symbol;
  }
};

const _getAddressOrThrowInputError = (address: string, paramName: string) => {
  try {
    return ethers.utils.getAddress(address);
  } catch (err) {
    throw new InvalidParamError({
      message: `Invalid address provided for '${paramName}'`,
      param: paramName,
    });
  }
};

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
      provider: getProvider(HUB_POOL_CHAIN_ID),
    },
    (_, __) => {} // Dummy function that does nothing and is needed to construct this client.
  );
};

export const getGasMarkup = (
  chainId: string | number
): {
  baseFeeMarkup: BigNumber;
  priorityFeeMarkup: BigNumber;
  opStackL1DataFeeMarkup: BigNumber;
} => {
  let _baseFeeMarkup: BigNumber | undefined;
  let _priorityFeeMarkup: BigNumber | undefined;
  let _opStackL1DataFeeMarkup: BigNumber | undefined;
  if (typeof baseFeeMarkup[chainId] === "number") {
    _baseFeeMarkup = utils.parseEther((1 + baseFeeMarkup[chainId]).toString());
  }
  if (typeof priorityFeeMarkup[chainId] === "number") {
    _priorityFeeMarkup = utils.parseEther(
      (1 + priorityFeeMarkup[chainId]).toString()
    );
  }
  if (typeof opStackL1DataFeeMarkup[chainId] === "number") {
    _opStackL1DataFeeMarkup = utils.parseEther(
      (1 + opStackL1DataFeeMarkup[chainId]).toString()
    );
  }

  // Otherwise, use default gas markup (or optimism's for OP stack).
  if (_baseFeeMarkup === undefined) {
    _baseFeeMarkup = utils.parseEther(
      (
        1 +
        (sdk.utils.chainIsOPStack(Number(chainId))
          ? baseFeeMarkup[CHAIN_IDs.OPTIMISM] ?? DEFAULT_GAS_MARKUP
          : DEFAULT_GAS_MARKUP)
      ).toString()
    );
  }
  if (_priorityFeeMarkup === undefined) {
    _priorityFeeMarkup = utils.parseEther(
      (
        1 +
        (sdk.utils.chainIsOPStack(Number(chainId))
          ? priorityFeeMarkup[CHAIN_IDs.OPTIMISM] ?? DEFAULT_GAS_MARKUP
          : DEFAULT_GAS_MARKUP)
      ).toString()
    );
  }
  if (_opStackL1DataFeeMarkup === undefined) {
    _opStackL1DataFeeMarkup = utils.parseEther(
      (
        1 +
        (sdk.utils.chainIsOPStack(Number(chainId))
          ? opStackL1DataFeeMarkup[CHAIN_IDs.OPTIMISM] ?? DEFAULT_GAS_MARKUP
          : DEFAULT_GAS_MARKUP)
      ).toString()
    );
  }

  return {
    baseFeeMarkup: _baseFeeMarkup,
    priorityFeeMarkup: _priorityFeeMarkup,
    opStackL1DataFeeMarkup: _opStackL1DataFeeMarkup,
  };
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
  const queries = getRelayerFeeCalculatorQueries(destinationChainId, overrides);
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

export const getRelayerFeeCalculatorQueries = (
  destinationChainId: number,
  overrides: Partial<{
    spokePoolAddress: string;
    relayerAddress: string;
  }> = {}
) => {
  return sdk.relayFeeCalculator.QueryBase__factory.create(
    destinationChainId,
    getProvider(destinationChainId, { useSpeedProvider: true }),
    undefined,
    overrides.spokePoolAddress || getSpokePoolAddress(destinationChainId),
    overrides.relayerAddress,
    REACT_APP_COINGECKO_PRO_API_KEY,
    getLogger()
  );
};

/**
 * Retrieves the results of the `relayFeeCalculator` SDK function: `relayerFeeDetails`
 * @param inputToken A valid input token address
 * @param outputToken A valid output token address
 * @param amount  The amount of funds that are requesting to be transferred
 * @param originChainId The origin chain that this token will be transferred from
 * @param destinationChainId The destination chain that this token will be transferred to
 * @param recipientAddress The address that will receive the transferred funds
 * @param message An optional message to include in the transfer
 * @param tokenPrice Price of input token in gas token units, used by SDK to compute gas fee percentages.
 * @param relayerAddress Relayer address that SDK will use to simulate the fill transaction for gas cost estimation if
 * the gasUnits is not defined.
 * @param gasPrice Gas price that SDK will use to compute gas fee percentages.
 * @param [gasUnits] An optional gas cost to use for the transfer. If not provided, the SDK will recompute this.
 * @returns Relayer fee components for a fill of the given `amount` of transferring `l1Token` to `destinationChainId`
 */
export const getRelayerFeeDetails = async (
  deposit: {
    inputToken: string;
    outputToken: string;
    amount: sdk.utils.BigNumberish;
    originChainId: number;
    destinationChainId: number;
    recipientAddress: string;
    message?: string;
  },
  tokenPrice: number,
  relayerAddress: string,
  gasPrice?: sdk.utils.BigNumberish,
  gasUnits?: sdk.utils.BigNumberish,
  tokenGasCost?: sdk.utils.BigNumberish
): Promise<sdk.relayFeeCalculator.RelayerFeeDetails> => {
  const {
    inputToken,
    outputToken,
    amount,
    originChainId,
    destinationChainId,
    recipientAddress,
    message,
  } = deposit;
  const relayFeeCalculator = getRelayerFeeCalculator(destinationChainId, {
    relayerAddress,
  });
  return await relayFeeCalculator.relayerFeeDetails(
    buildDepositForSimulation({
      amount: amount.toString(),
      inputToken,
      outputToken,
      recipientAddress,
      originChainId,
      destinationChainId,
      message,
    }),
    amount,
    sdk.utils.isMessageEmpty(message),
    relayerAddress,
    tokenPrice,
    gasPrice,
    gasUnits,
    tokenGasCost
  );
};

export const buildDepositForSimulation = (depositArgs: {
  amount: BigNumberish;
  inputToken: string;
  outputToken: string;
  recipientAddress: string;
  originChainId: number;
  destinationChainId: number;
  message?: string;
}) => {
  const {
    amount,
    inputToken,
    outputToken,
    recipientAddress,
    originChainId,
    destinationChainId,
    message,
  } = depositArgs;
  // Small amount to simulate filling with. Should be low enough to guarantee a successful fill.
  const safeOutputAmount = sdk.utils.toBN(100);
  return {
    inputAmount: sdk.utils.toBN(amount),
    outputAmount: sdk.utils.isMessageEmpty(message)
      ? safeOutputAmount
      : sdk.utils.toBN(amount),
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
    fromLiteChain: false, // FIXME
    toLiteChain: false, // FIXME
  };
};

/**
 * Creates an HTTP call to the `/api/coingecko` endpoint to resolve a CoinGecko price
 * @param l1Token The ERC20 token address of the coin to find the cached price of
 * @param baseCurrency The base currency to convert the token price to
 * @param date An optional date string in the format of `DD-MM-YYYY` to resolve a historical price
 * @returns The price of the `l1Token` token.
 */
export const getCachedTokenPrice = async (
  l1Token: string,
  baseCurrency: string = "eth",
  historicalDateISO?: string
): Promise<number> => {
  return Number(
    (
      await axios(`${resolveVercelEndpoint()}/api/coingecko`, {
        params: { l1Token, baseCurrency, date: historicalDateISO },
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
  destinationChainId: number,
  amount?: string,
  recipient?: string,
  relayer?: string,
  message?: string
): Promise<{
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
  recommendedDepositInstant: string;
  relayerFeeDetails: {
    relayFeeTotal: string;
    relayFeePercent: string;
    capitalFeePercent: string;
    capitalFeeTotal: string;
    gasFeePercent: string;
    gasFeeTotal: string;
  };
}> => {
  return (
    await axios(`${resolveVercelEndpoint()}/api/limits`, {
      params: {
        inputToken,
        outputToken,
        originChainId,
        destinationChainId,
        amount,
        message,
        recipient,
        relayer,
      },
    })
  ).data;
};

export const providerCache: Record<string, StaticJsonRpcProvider> = {};

/**
 * Generates a relevant provider for the given input chainId
 * @param _chainId A valid chain identifier where Across is deployed
 * @returns A provider object to query the requested blockchain
 */
export const getProvider = (
  _chainId: number,
  opts = {
    useSpeedProvider: false,
  }
): providers.StaticJsonRpcProvider => {
  const chainId = _chainId.toString();
  const cacheKey = `${chainId}-${opts.useSpeedProvider}`;
  if (!providerCache[cacheKey]) {
    // Resolves provider from urls set in rpc-providers.json.
    const providerFromConfigJson = getProviderFromConfigJson(chainId, opts);
    // Resolves provider from urls set via environment variables.
    // Note that this is legacy and should be removed in the future.
    const override = overrideProvider(chainId);

    if (providerFromConfigJson) {
      providerCache[cacheKey] = providerFromConfigJson;
    } else if (override) {
      providerCache[cacheKey] = override;
    } else {
      providerCache[cacheKey] = infuraProvider(_chainId);
    }
  }
  return providerCache[cacheKey];
};

/**
 * Resolves a provider from the `rpc-providers.json` configuration file.
 */
function getProviderFromConfigJson(
  _chainId: string,
  opts = {
    useSpeedProvider: false,
  }
) {
  const chainId = Number(_chainId);
  const urls = getRpcUrlsFromConfigJson(chainId);

  if (urls.length === 0) {
    console.warn(
      `No provider URL found for chainId ${chainId} in rpc-providers.json`
    );
    return undefined;
  }

  if (!opts.useSpeedProvider) {
    return new sdk.providers.RetryProvider(
      urls.map((url) => [{ url, errorPassThrough: true }, chainId]),
      chainId,
      1, // quorum can be 1 in the context of the API
      3, // retries
      0.5, // delay
      5, // max. concurrency
      "RPC_PROVIDER", // cache namespace
      0 // disable RPC calls logging
    );
  }

  return new sdk.providers.SpeedProvider(
    urls.map((url) => [{ url, errorPassThrough: true }, chainId]),
    chainId,
    3, // max. concurrency used in `SpeedProvider`
    5, // max. concurrency used in `RateLimitedProvider`
    "RPC_PROVIDER", // cache namespace
    1 // disable RPC calls logging
  );
}

export function getRpcUrlsFromConfigJson(chainId: number) {
  const urls: string[] = [];

  const { providers } = rpcProvidersJson;
  const enabledProviders: RpcProviderName[] =
    (providers.enabled as Record<string, RpcProviderName[]>)[chainId] ||
    providers.enabled.default;

  for (const provider of enabledProviders) {
    const providerUrl = (providers.urls[provider] as Record<string, string>)?.[
      chainId
    ];
    if (providerUrl) {
      urls.push(providerUrl);
    }
  }

  return urls;
}

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
    default:
      return sdk.utils.getDeployedAddress("SpokePool", chainId) as string;
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
  token: string,
  blockTag?: string | number
): Promise<BigNumber> => {
  return sdk.utils.getTokenBalance(
    account,
    token,
    getProvider(Number(chainId)),
    blockTag ?? BLOCK_TAG_LAG
  );
};

/**
 * Fetches the balances for an array of addresses on a particular chain, for a particular erc20 token
 * @param chainId The blockchain Id to query against
 * @param addresses An array of valid Web3 wallet addresses
 * @param tokenAddress The valid ERC20 token address on the given `chainId` or ZERO_ADDRESS for native balances
 * @param blockTag Block to query from, defaults to latest block
 * @returns a Promise that resolves to an array of BigNumbers
 */
export const getBatchBalanceViaMulticall3 = async (
  chainId: string | number,
  addresses: string[],
  tokenAddresses: string[],
  blockTag: providers.BlockTag = "latest"
): Promise<{
  blockNumber: providers.BlockTag;
  balances: Record<string, Record<string, string>>;
}> => {
  const chainIdAsInt = Number(chainId);
  const provider = getProvider(chainIdAsInt);

  const multicall3 = getMulticall3(chainIdAsInt, provider);

  if (!multicall3) {
    throw new Error("No Multicall3 deployed on this chain");
  }

  let calls: Parameters<typeof callViaMulticall3>[1] = [];

  for (const tokenAddress of tokenAddresses) {
    if (tokenAddress === sdk.constants.ZERO_ADDRESS) {
      // For native currency
      calls.push(
        ...addresses.map((address) => ({
          contract: multicall3,
          functionName: "getEthBalance",
          args: [address],
        }))
      );
    } else {
      // For ERC20 tokens
      const erc20Contract = ERC20__factory.connect(tokenAddress, provider);
      calls.push(
        ...addresses.map((address) => ({
          contract: erc20Contract,
          functionName: "balanceOf",
          args: [address],
        }))
      );
    }
  }

  const inputs = calls.map(({ contract, functionName, args }) => ({
    target: contract.address,
    callData: contract.interface.encodeFunctionData(functionName, args),
  }));

  const [blockNumber, results] = await multicall3.callStatic.aggregate(inputs, {
    blockTag,
  });

  const decodedResults = results.map((result, i) =>
    calls[i].contract.interface.decodeFunctionResult(
      calls[i].functionName,
      result
    )
  );

  let balances: Record<string, Record<string, string>> = {};

  let resultIndex = 0;
  for (const tokenAddress of tokenAddresses) {
    addresses.forEach((address) => {
      if (!balances[address]) {
        balances[address] = {};
      }
      balances[address][tokenAddress] = decodedResults[resultIndex].toString();
      resultIndex++;
    });
  }

  return {
    blockNumber: blockNumber.toNumber(),
    balances,
  };
};

export function getMulticall3(
  chainId: number,
  signerOrProvider?: Signer | providers.Provider
): Multicall3 | undefined {
  const address = sdk.utils.getMulticallAddress(chainId);

  // no multicall on this chain
  if (!address) {
    return undefined;
  }

  return new ethers.Contract(
    address,
    MINIMAL_MULTICALL3_ABI,
    signerOrProvider
  ) as Multicall3;
}

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
  const balance = await latestBalanceCache({
    chainId: Number(chainId),
    tokenAddress: token,
    address: account,
  }).get();
  return balance;
};

/**
 * Resolves the cached balance of a given ERC20 token at a provided address. If no token is provided, the balance of the
 * native currency will be returned.
 * @param chainId The blockchain Id to query against
 * @param account A valid Web3 wallet address
 * @param token The valid ERC20 token address on the given `chainId`.
 * @returns A promise that resolves to the BigNumber of the balance
 */
export const getCachedTokenBalances = async (
  chainId: string | number,
  addresses: string[],
  tokenAddresses: string[]
): Promise<BatchAccountBalanceResponse> => {
  const response = await axios.get<BatchAccountBalanceResponse>(
    `${resolveVercelEndpoint()}/api/batch-account-balance?${buildSearchParams({
      chainId,
      addresses,
      tokenAddresses,
    })}`
  );

  return response.data;
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

// superstruct first coerces, then validates
export const positiveInt = coerce(min(integer(), 0), string(), (value) =>
  Number(value)
);

// parses, coerces and validates query params
// first coerce any fields that can be coerced, then validate
export function parseQuery<
  Q extends VercelRequestQuery,
  S extends Struct<any, any>,
>(query: Q, schema: S): Infer<S> {
  const coerced = create(query, schema);
  assert(coerced, schema);
  return coerced;
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
    const provider = getProvider(HUB_POOL_CHAIN_ID);
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

export function tagDomain(dataHex: string, domainIdentifier: string): string {
  if (!ethers.utils.isHexString(dataHex)) {
    throw new Error("Data must be a valid hex string");
  }
  if (!ethers.utils.isHexString(domainIdentifier)) {
    throw new Error("Domain identifier must be a valid hex string");
  }
  return ethers.utils.hexConcat([
    dataHex,
    DOMAIN_CALLDATA_DELIMITER,
    domainIdentifier,
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

export async function getPoolStateForUser(
  tokenAddress: string,
  userAddress: string
): Promise<PoolStateOfUser> {
  return getAcrossPoolUserState(tokenAddress, userAddress);
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
    liquidityUtilizationCurrent: "0",
  };
}

export async function getAcrossPoolState(tokenAddress: string) {
  const hubPoolClient = getHubPoolClient();
  await hubPoolClient.updatePool(tokenAddress);
  return hubPoolClient.getPoolState(tokenAddress);
}

export async function getAcrossPoolUserState(
  tokenAddress: string,
  userAddress: string
) {
  const hubPoolClient = getHubPoolClient();
  await hubPoolClient.updateUser(userAddress, tokenAddress);
  return hubPoolClient.getUserState(tokenAddress, userAddress);
}

export async function getExternalPoolState(
  tokenAddress: string,
  externalPoolProvider: string
) {
  switch (externalPoolProvider) {
    case "balancer":
      return getBalancerPoolState(tokenAddress);
    default:
      throw new InvalidParamError({
        message: "Invalid external pool provider",
        param: "externalPoolProvider",
      });
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

  const theGraphBaseUrl = `https://gateway-arbitrum.network.thegraph.com/api/${graphAPIKey}/subgraphs/id`;
  const defaultNetworkConfig = BALANCER_NETWORK_CONFIG[HUB_POOL_CHAIN_ID];
  const config = {
    network: {
      ...defaultNetworkConfig,
      pools: {
        ...defaultNetworkConfig.pools,
        ...supportedBalancerPoolsMap[HUB_POOL_CHAIN_ID],
      },
      // Due to an upgrade, we can no longer rely on the balancer hosted subgraph
      // to fetch the pool data. We need to use a new on-chain subgraph which requires
      // us to hardcode the URLs for each required subgraph. The caveat here is that
      // we now need an API key to access the subgraphs.
      urls: {
        subgraph: `${theGraphBaseUrl}/C4ayEZP2yTXRAB8vSaTrgN4m9anTe9Mdm2ViyiAuV9TV`,
        gaugesSubgraph: `${theGraphBaseUrl}/4sESujoqmztX6pbichs4wZ1XXyYrkooMuHA8sKkYxpTn`,
        blockNumberSubgraph: `${theGraphBaseUrl}/9A6bkprqEG2XsZUYJ5B2XXp6ymz9fNcn4tVPxMWDztYC`,
      },
    } as BalancerNetworkConfig,
    rpcUrl: getRpcUrlsFromConfigJson(HUB_POOL_CHAIN_ID)[0],
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
    throw new InvalidParamError({
      message: `Balancer pool with address ${poolTokenAddress} not found`,
      param: "poolTokenAddress",
    });
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
    throw new InvalidParamError({
      message: `Balancer pool with address ${poolTokenAddress} not found`,
      param: "poolTokenAddress",
    });
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
    liquidityUtilizationCurrent: pool.liquidity || "0",
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
  const chainId = provider.network.chainId;
  const multicall3 = new ethers.Contract(
    MULTICALL3_ADDRESS_OVERRIDES[chainId] ?? MULTICALL3_ADDRESS,
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
): Promise<number> {
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
  const symbolOverride = symbol
    ? defaultRelayerAddressOverride?.symbols?.[symbol]
    : undefined;
  return (
    symbolOverride?.chains?.[destinationChainId] ?? // Specific Symbol/Chain override
    symbolOverride?.defaultAddr ?? // Specific Symbol override
    defaultRelayerAddressOverride?.defaultAddr ?? // Default override
    sdk.constants.DEFAULT_SIMULATED_RELAYER_ADDRESS // Default hardcoded value
  );
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

export function getLimitsBufferMultiplier(symbol: string) {
  const limitsBufferMultipliers: Record<string, string> = process.env
    .LIMITS_BUFFER_MULTIPLIERS
    ? JSON.parse(process.env.LIMITS_BUFFER_MULTIPLIERS)
    : {};
  const bufferMultiplier = ethers.utils.parseEther(
    limitsBufferMultipliers[symbol] || "0.8"
  );
  const multiplierCap = ethers.utils.parseEther("1");
  return bufferMultiplier.gt(multiplierCap) ? multiplierCap : bufferMultiplier;
}

export function getChainInputTokenMaxBalanceInUsd(
  chainId: number,
  symbol: string,
  includeDefault: boolean
) {
  const maxBalances: Record<string, Record<string, string>> = process.env
    .CHAIN_USD_MAX_BALANCES
    ? JSON.parse(process.env.CHAIN_USD_MAX_BALANCES)
    : {};
  const defaultValue = includeDefault
    ? DEFAULT_LITE_CHAIN_USD_MAX_BALANCE
    : undefined;
  return maxBalances[chainId.toString()]?.[symbol] || defaultValue;
}

export function getChainInputTokenMaxDepositInUsd(
  chainId: number,
  symbol: string,
  includeDefault: boolean
) {
  const maxDeposits: Record<string, Record<string, string>> = process.env
    .CHAIN_USD_MAX_DEPOSITS
    ? JSON.parse(process.env.CHAIN_USD_MAX_DEPOSITS)
    : {};
  const defaultValue = includeDefault
    ? DEFAULT_LITE_CHAIN_USD_MAX_DEPOSIT
    : undefined;
  return maxDeposits[chainId.toString()]?.[symbol] || defaultValue;
}

export function getCachedLatestBlock(chainId: number) {
  const ttlPerChain = {
    default: 2,
    [CHAIN_IDs.MAINNET]: 12,
  };

  return getCachedValue(
    buildInternalCacheKey("latestBlock", chainId),
    ttlPerChain[chainId] || ttlPerChain.default,
    async () => {
      const block = await getProvider(chainId).getBlock("latest");
      return {
        number: block.number,
        timestamp: block.timestamp,
      } as ethers.providers.Block;
    }
  );
}

export function latestBalanceCache(params: {
  chainId: number;
  tokenAddress: string;
  address: string;
}) {
  const { chainId, tokenAddress, address } = params;
  const ttlPerChain = {
    default: 60,
    [CHAIN_IDs.MAINNET]: 60,
  };

  return makeCacheGetterAndSetter(
    buildInternalCacheKey("latestBalance", tokenAddress, chainId, address),
    ttlPerChain[chainId] || ttlPerChain.default,
    () => getBalance(chainId, address, tokenAddress),
    (bnFromCache) => BigNumber.from(bnFromCache)
  );
}

export function isContractCache(chainId: number, address: string) {
  return makeCacheGetterAndSetter(
    buildInternalCacheKey("isContract", chainId, address),
    5 * 24 * 60 * 60, // 5 days - we can cache this for a long time
    async () => {
      const isDeployed = await sdk.utils.isContractDeployedToAddress(
        address,
        getProvider(chainId)
      );
      return isDeployed;
    }
  );
}

export function getCachedNativeGasCost(
  deposit: Parameters<typeof buildDepositForSimulation>[0],
  overrides?: Partial<{
    relayerAddress: string;
  }>
) {
  // We can use a long TTL since we are fetching only the native gas cost which should rarely change.
  const ttlPerChain = {
    default: 60,
  };

  const cacheKey = buildInternalCacheKey(
    "nativeGasCost",
    deposit.destinationChainId,
    deposit.outputToken
  );
  const ttl = ttlPerChain.default;
  const fetchFn = async () => {
    const relayerAddress =
      overrides?.relayerAddress ??
      sdk.constants.DEFAULT_SIMULATED_RELAYER_ADDRESS;
    const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
      deposit.destinationChainId,
      overrides
    );
    const unsignedFillTxn =
      await relayerFeeCalculatorQueries.getUnsignedTxFromDeposit(
        buildDepositForSimulation(deposit),
        relayerAddress
      );
    const voidSigner = new ethers.VoidSigner(
      relayerAddress,
      relayerFeeCalculatorQueries.provider
    );
    return voidSigner.estimateGas(unsignedFillTxn);
  };

  return getCachedValue(cacheKey, ttl, fetchFn, (nativeGasCostFromCache) => {
    return BigNumber.from(nativeGasCostFromCache);
  });
}

export function getCachedOpStackL1DataFee(
  deposit: Parameters<typeof buildDepositForSimulation>[0],
  nativeGasCost: BigNumber,
  overrides?: Partial<{
    relayerAddress: string;
  }>
) {
  // This should roughly be the length of 1 block on Ethereum mainnet which is how often the L1 data fee should
  // change since its based on the L1 base fee. However, this L1 data fee is mostly affected by the L1 base fee which
  // should only change by 12.5% at most per block.
  const ttlPerChain = {
    default: 12,
  };

  const cacheKey = buildInternalCacheKey(
    "opStackL1DataFee",
    deposit.destinationChainId,
    deposit.outputToken // This should technically differ based on the output token since the L2 calldata
    // size affects the L1 data fee and this calldata can differ based on the output token.
  );
  const ttl = ttlPerChain.default;
  const fetchFn = async () => {
    // We don't care about the gas token price or the token gas price, only the raw gas units. In the API
    // we'll compute the gas price separately.
    const { opStackL1DataFeeMarkup } = getGasMarkup(deposit.destinationChainId);
    const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
      deposit.destinationChainId,
      overrides
    );
    const unsignedTx =
      await relayerFeeCalculatorQueries.getUnsignedTxFromDeposit(
        buildDepositForSimulation(deposit),
        overrides?.relayerAddress
      );
    const opStackL1GasCost =
      await relayerFeeCalculatorQueries.getOpStackL1DataFee(
        unsignedTx,
        overrides?.relayerAddress,
        {
          opStackL2GasUnits: nativeGasCost, // Passed in here to avoid gas cost recomputation by the SDK
          opStackL1DataFeeMultiplier: opStackL1DataFeeMarkup,
        }
      );
    return opStackL1GasCost;
  };

  return getCachedValue(cacheKey, ttl, fetchFn, (l1DataFeeFromCache) => {
    return BigNumber.from(l1DataFeeFromCache);
  });
}

export function latestGasPriceCache(
  chainId: number,
  deposit?: Parameters<typeof buildDepositForSimulation>[0],
  overrides?: Partial<{
    relayerAddress: string;
  }>
) {
  const ttlPerChain = {
    default: 5,
  };
  return makeCacheGetterAndSetter(
    // If deposit is defined, then the gas price will be dependent on the fill transaction derived from the deposit.
    // Therefore, we technically should cache a different gas price per different types of deposit so we add
    // an additional outputToken to the cache key to distinguish between gas prices dependent on deposit args
    // for different output tokens, which should be the main factor affecting the fill gas cost.
    buildInternalCacheKey(
      `latestGasPriceCache${deposit ? `-${deposit.outputToken}` : ""}`,
      chainId
    ),
    ttlPerChain.default,
    async () =>
      (await getMaxFeePerGas(chainId, deposit, overrides)).maxFeePerGas,
    (bnFromCache) => BigNumber.from(bnFromCache)
  );
}

export async function getMaxFeePerGas(
  chainId: number,
  deposit?: Parameters<typeof buildDepositForSimulation>[0],
  overrides?: Partial<{
    relayerAddress: string;
  }>
): Promise<sdk.gasPriceOracle.GasPriceEstimate> {
  if (deposit && deposit.destinationChainId !== chainId) {
    throw new Error(
      "Chain ID must match the destination chain ID of the deposit"
    );
  }
  const {
    baseFeeMarkup: baseFeeMultiplier,
    priorityFeeMarkup: priorityFeeMultiplier,
  } = getGasMarkup(chainId);
  const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
    chainId,
    overrides
  );
  const unsignedFillTxn = deposit
    ? await relayerFeeCalculatorQueries.getUnsignedTxFromDeposit(
        buildDepositForSimulation(deposit),
        overrides?.relayerAddress
      )
    : undefined;
  return sdk.gasPriceOracle.getGasPriceEstimate(getProvider(chainId), {
    chainId,
    unsignedTx: unsignedFillTxn,
    baseFeeMultiplier,
    priorityFeeMultiplier,
  });
}

/**
 * Builds a URL search string from an object of query parameters.
 *
 * @param params - An object where keys are query parameter names and values are either a string or an array of strings representing the parameter values.
 *
 * @returns queryString - A properly formatted query string for use in URLs, (without the leading '?').
 *
 * @example
 * ```typescript
 * const params = {
 *   age: 45, // numbers will be converted to strings
 *   foos: ["foo1", "foo1"],
 *   bars: ["bar1", "bar2", "bar3"],
 * };
 *
 * const queryString = buildSearchParams(params);
 * console.log(queryString); // "search=test&filter=price&filter=rating&sort=asc"
 * const res = await axios.get(`${base_url}?${queryString}`)
 * ```
 */

export function buildSearchParams(
  params: Record<string, number | string | Array<number | string>>
): string {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((val) => searchParams.append(key, String(val)));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

export function paramToArray<T extends undefined | string | string[]>(
  param: T
): string[] | undefined {
  if (!param) return;
  return Array.isArray(param) ? param : [param];
}
