import { AcceleratingDistributor__factory } from "@across-protocol/across-token/dist/typechain";
import {
  ERC20__factory,
  HubPool__factory,
} from "@across-protocol/contracts/dist/typechain";
import acrossDeployments from "@across-protocol/contracts/dist/deployments/deployments.json";
import * as sdk from "@across-protocol/sdk";
import {
  BALANCER_NETWORK_CONFIG,
  BalancerSDK,
  BalancerNetworkConfig,
} from "@balancer-labs/sdk";
import axios, { AxiosError, AxiosRequestHeaders } from "axios";
import { BigNumber, BigNumberish, ethers, providers, utils } from "ethers";
import {
  assert,
  coerce,
  create,
  define,
  Infer,
  integer,
  min,
  size,
  string,
  Struct,
  union,
} from "superstruct";
import enabledMainnetRoutesAsJson from "../src/data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import enabledSepoliaRoutesAsJson from "../src/data/routes_11155111_0x14224e63716afAcE30C9a417E0542281869f7d9e.json";

import {
  MINIMAL_BALANCER_V2_POOL_ABI,
  MINIMAL_BALANCER_V2_VAULT_ABI,
} from "./_abis";
import { BatchAccountBalanceResponse } from "./batch-account-balance";
import { VercelRequestQuery, VercelResponse } from "@vercel/node";
import {
  CHAIN_IDs,
  CHAINS,
  CUSTOM_GAS_TOKENS,
  DEFAULT_LITE_CHAIN_USD_MAX_BALANCE,
  DEFAULT_LITE_CHAIN_USD_MAX_DEPOSIT,
  DEFI_LLAMA_POOL_LOOKUP,
  DOMAIN_CALLDATA_DELIMITER,
  EXTERNAL_POOL_TOKEN_EXCHANGE_RATE,
  SECONDS_PER_YEAR,
  TOKEN_SYMBOLS_MAP,
  disabledL1Tokens,
  graphAPIKey,
  maxRelayFeePct,
  relayerFeeCapitalCostConfig,
} from "./_constants";
import { PoolStateOfUser, PoolStateResult, TokenInfo } from "./_types";
import {
  buildInternalCacheKey,
  getCachedValue,
  makeCacheGetterAndSetter,
} from "./_cache";
import {
  MissingParamError,
  InvalidParamError,
  RouteNotEnabledError,
  AcrossApiError,
  HttpErrorToStatusCode,
  AcrossErrorCode,
  TokenNotFoundError,
} from "./_errors";
import { Token } from "./_dexes/types";
import {
  getProvider,
  getSvmProvider,
  getRpcUrlsFromConfigJson,
  getProviderHeaders,
} from "./_providers";
import { getLogger, logger } from "./_logger";
import { getEnvs } from "./_env";
import { isEvmAddress, isSvmAddress } from "./_address";
import { getBalance, getBatchBalance } from "./_balance";
import { callViaMulticall3 } from "./_multicall";
import { getDefaultRelayerAddress } from "./_relayer-address";
import { getSpokePoolAddress, getSpokePool } from "./_spoke-pool";
import { getMulticall3, getMulticall3Address } from "./_multicall";

export { InputError, handleErrorCondition } from "./_errors";
export const { Profiler } = sdk.utils;
export {
  getLogger,
  logger,
  getProvider,
  getBalance,
  getBatchBalance,
  getProviderHeaders,
  callViaMulticall3,
  getMulticall3,
  getMulticall3Address,
  getSpokePoolAddress,
  getSpokePool,
};

const {
  REACT_APP_HUBPOOL_CHAINID,
  REACT_APP_COINGECKO_PRO_API_KEY,
  BASE_FEE_MARKUP,
  PRIORITY_FEE_MARKUP,
  OP_STACK_L1_DATA_FEE_MARKUP,
  REACT_APP_DISABLED_CHAINS,
  REACT_APP_DISABLED_CHAINS_FOR_AVAILABLE_ROUTES,
  REACT_APP_DISABLED_TOKENS_FOR_AVAILABLE_ROUTES,
  LIMITS_BUFFER_MULTIPLIERS,
  CHAIN_USD_MAX_BALANCES,
  CHAIN_USD_MAX_DEPOSITS,
  VERCEL_AUTOMATION_BYPASS_SECRET,
} = getEnvs();

// Don't permit HUB_POOL_CHAIN_ID=0
export const HUB_POOL_CHAIN_ID = Number(REACT_APP_HUBPOOL_CHAINID || 1) as
  | 1
  | 11155111;

// Tokens that should be disabled in the routes
export const DISABLED_ROUTE_TOKENS = (
  getEnvs().DISABLED_ROUTE_TOKENS || ""
).split(",");

// This is an array of chainIds that should be disabled. This array overrides
// the ENABLED_ROUTES object below. This is useful for disabling a chainId
// temporarily without having to redeploy the app or change core config
// data (e.g. the ENABLED_ROUTES object and the data/routes.json files).
export const DISABLED_CHAINS = (REACT_APP_DISABLED_CHAINS || "").split(",");

// This is an array of chainIds that should be disabled. In contrast to the
// above constant `DISABLED_CHAINS`, this constant is used to disable chains
// only for the `/available-routes` endpoint and DOES NOT affect the
// `ENABLED_ROUTES` object.
export const DISABLED_CHAINS_FOR_AVAILABLE_ROUTES = (
  REACT_APP_DISABLED_CHAINS_FOR_AVAILABLE_ROUTES || ""
).split(",");

export const DISABLED_TOKENS_FOR_AVAILABLE_ROUTES = (
  REACT_APP_DISABLED_TOKENS_FOR_AVAILABLE_ROUTES || ""
).split(",");

// Chains that require special role to be accessed.
export const OPT_IN_CHAINS = (getEnvs().OPT_IN_CHAINS || "").split(",");

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
 * Resolves the current vercel endpoint dynamically
 * @returns A valid URL of the current endpoint in vercel
 */
export const resolveVercelEndpoint = (omitOverride = false) => {
  if (!omitOverride && process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE) {
    return process.env.REACT_APP_VERCEL_API_BASE_URL_OVERRIDE;
  }
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

export const getVercelHeaders = (): AxiosRequestHeaders | undefined => {
  if (VERCEL_AUTOMATION_BYPASS_SECRET) {
    return {
      "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET,
    };
  }
};

export const validateChainAndTokenParams = (
  queryParams: Partial<{
    token: string;
    inputToken: string;
    outputToken: string;
    originChainId: string;
    destinationChainId: string;
    allowUnmatchedDecimals: string;
  }>
) => {
  let {
    token,
    inputToken: inputTokenAddress,
    outputToken: outputTokenAddress,
    originChainId,
    destinationChainId: _destinationChainId,
    allowUnmatchedDecimals: _allowUnmatchedDecimals,
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
  const allowUnmatchedDecimals = _allowUnmatchedDecimals === "true";

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

  if (!allowUnmatchedDecimals && inputToken.decimals !== outputToken.decimals) {
    throw new InvalidParamError({
      message:
        `Decimals of input and output tokens do not match. ` +
        `This is likely due to unmatched decimals for USDC/USDT on BNB Chain. ` +
        `Make sure to have followed the migration guide: ` +
        `https://docs.across.to/introduction/migration-guides/bnb-chain-migration-guide ` +
        `and set the query param 'allowUnmatchedDecimals=true' to allow this.`,
      param: "allowUnmatchedDecimals",
    });
  }

  return {
    l1Token,
    inputToken,
    outputToken,
    destinationChainId,
    resolvedOriginChainId,
    allowUnmatchedDecimals,
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
  const addressType = sdk.utils.toAddressType(address);
  let comparableAddress = address;

  if (sdk.utils.chainIsSvm(chainId)) {
    try {
      comparableAddress = addressType.toBase58();
    } catch (error) {
      // noop
    }
  } else {
    if (addressType.isValidEvmAddress()) {
      comparableAddress = addressType.toEvmAddress();
    }
  }

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
    (contract) =>
      contract.address.toLowerCase() === comparableAddress.toLowerCase()
  );
  return !!deployedAcrossContract;
}

export function getChainInfo(chainId: number) {
  const chainInfo = CHAINS[chainId];
  if (!chainInfo) {
    throw new Error(`Cannot get chain info for chain ${chainId}`);
  }

  return chainInfo;
}

export function getWrappedNativeTokenAddress(chainId: number) {
  const chainInfo = getChainInfo(chainId);
  const wrappedNativeTokenSymbol =
    chainId === CHAIN_IDs.LENS ? "WGHO" : `W${chainInfo.nativeToken}`;
  const wrappedNativeToken =
    TOKEN_SYMBOLS_MAP[
      wrappedNativeTokenSymbol as keyof typeof TOKEN_SYMBOLS_MAP
    ];
  const wrappedNativeTokenAddress = wrappedNativeToken?.addresses[chainId];

  if (!wrappedNativeTokenAddress) {
    throw new Error(
      `Cannot get wrapped native token for chain ${chainId} and symbol ${wrappedNativeTokenSymbol}`
    );
  }

  return wrappedNativeTokenAddress;
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

  const parsedInputTokenAddress = sdk.utils.toAddressType(
    inputToken.addresses[resolvedOriginChainId]
  );
  const resolvedInputTokenAddress = sdk.utils.chainIsSvm(resolvedOriginChainId)
    ? parsedInputTokenAddress.toBase58()
    : parsedInputTokenAddress.toEvmAddress();
  const parsedOutputTokenAddress = sdk.utils.toAddressType(
    outputToken.addresses[destinationChainId]
  );
  const resolvedOutputTokenAddress = sdk.utils.chainIsSvm(destinationChainId)
    ? parsedOutputTokenAddress.toBase58()
    : parsedOutputTokenAddress.toEvmAddress();

  return {
    inputToken: {
      ...inputToken,
      symbol: _isBridgedUsdcOrVariant(inputToken.symbol)
        ? _getBridgedUsdcOrVariantTokenSymbol(
            inputToken.symbol,
            resolvedOriginChainId
          )
        : inputToken.symbol,
      address: resolvedInputTokenAddress,
    },
    outputToken: {
      ...outputToken,
      symbol: _isBridgedUsdcOrVariant(outputToken.symbol)
        ? _getBridgedUsdcOrVariantTokenSymbol(
            outputToken.symbol,
            destinationChainId
          )
        : outputToken.symbol,
      address: resolvedOutputTokenAddress,
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
  try {
    const parsedTokenAddress = sdk.utils.toAddressType(tokenAddress);
    if (chainId && sdk.utils.chainIsSvm(chainId)) {
      tokenAddress = parsedTokenAddress.toBase58();
    } else {
      tokenAddress = parsedTokenAddress.toEvmAddress();
    }

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

    const ambiguousTokens = ["USDC", "USDT"];
    const isAmbiguous =
      matches.length > 1 &&
      matches.some(([symbol]) => ambiguousTokens.includes(symbol));
    if (isAmbiguous && chainId === HUB_POOL_CHAIN_ID) {
      const token = matches.find(([symbol]) =>
        ambiguousTokens.includes(symbol)
      );
      if (token) {
        return token[1];
      }
    }

    return matches[0][1];
  } catch (error) {
    return undefined;
  }
};

const _getChainIdsOfToken = (
  tokenAddress: string,
  token: Omit<
    (typeof TOKEN_SYMBOLS_MAP)[keyof typeof TOKEN_SYMBOLS_MAP],
    "coingeckoId"
  >
) => {
  const parsedAddress = sdk.utils.toAddressType(tokenAddress);
  const chainIds = Object.entries(token.addresses).filter(
    ([chainId, address]) => {
      const comparableAddress = sdk.utils.chainIsSvm(Number(chainId))
        ? parsedAddress.toBase58()
        : parsedAddress.toEvmAddress();
      return address.toLowerCase() === comparableAddress.toLowerCase();
    }
  );
  return chainIds.map(([chainId]) => Number(chainId));
};

const _isBridgedUsdcOrVariant = (tokenSymbol: string) => {
  return sdk.utils.isBridgedUsdc(tokenSymbol) || tokenSymbol === "USDC-BNB";
};

const _getBridgedUsdcOrVariantTokenSymbol = (
  tokenSymbol: string,
  chainId: number
) => {
  if (!_isBridgedUsdcOrVariant(tokenSymbol)) {
    throw new Error(
      `Token ${tokenSymbol} is not a bridged USDC token or variant`
    );
  }

  switch (chainId) {
    case CHAIN_IDs.BASE:
      return TOKEN_SYMBOLS_MAP.USDbC.symbol;
    case CHAIN_IDs.ZORA:
      return TOKEN_SYMBOLS_MAP.USDzC.symbol;
    case CHAIN_IDs.BSC:
      return TOKEN_SYMBOLS_MAP["USDC-BNB"].symbol;
    default:
      return TOKEN_SYMBOLS_MAP["USDC.e"].symbol;
  }
};

const _getAddressOrThrowInputError = (address: string, paramName: string) => {
  try {
    const parsedAddress = sdk.utils.toAddressType(address);
    return parsedAddress.toBytes32();
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

export const baseFeeMarkup: {
  [chainId: string]: number;
} = JSON.parse(BASE_FEE_MARKUP || "{}");
export const priorityFeeMarkup: {
  [chainId: string]: number;
} = JSON.parse(PRIORITY_FEE_MARKUP || "{}");
export const opStackL1DataFeeMarkup: {
  [chainId: string]: number;
} = JSON.parse(OP_STACK_L1_DATA_FEE_MARKUP || "{}");

// Conservative values bsaed on existing configurations:
// - base fee gets marked up 1.5x because most chains have a theoretically volatile base fee but practically little
// volume so the base fee doesn't move much.
// - priority fee gets marked up 1.0x because new chains don't have enough volume to move priority
// fees much.
// - op stack l1 data fee gets marked up 1.0x because the op stack l1 data fee is based on ethereum
// base fee.
export const DEFAULT_BASE_FEE_MARKUP = 0.5;
export const DEFAULT_PRIORITY_FEE_MARKUP = 0;
export const DEFAULT_OP_L1_DATA_FEE_MARKUP = 1;

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

  // Otherwise, use default gas markup.
  if (_baseFeeMarkup === undefined) {
    _baseFeeMarkup = utils.parseEther((1 + DEFAULT_BASE_FEE_MARKUP).toString());
  }
  if (_priorityFeeMarkup === undefined) {
    _priorityFeeMarkup = utils.parseEther(
      (1 + DEFAULT_PRIORITY_FEE_MARKUP).toString()
    );
  }
  if (_opStackL1DataFeeMarkup === undefined) {
    _opStackL1DataFeeMarkup = utils.parseEther(
      (1 + DEFAULT_OP_L1_DATA_FEE_MARKUP).toString()
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
  const baseArgs = {
    chainId: destinationChainId,
    symbolMapping: TOKEN_SYMBOLS_MAP,
    spokePoolAddress:
      overrides.spokePoolAddress || getSpokePoolAddress(destinationChainId),
    simulatedRelayerAddress:
      overrides.relayerAddress || getDefaultRelayerAddress(destinationChainId),
    coingeckoProApiKey: REACT_APP_COINGECKO_PRO_API_KEY,
    logger: getLogger(),
  };
  const parsedSpokePoolAddress = sdk.utils.toAddressType(
    baseArgs.spokePoolAddress
  );
  const parsedSimulatedRelayerAddress = sdk.utils.toAddressType(
    baseArgs.simulatedRelayerAddress
  );

  if (sdk.utils.chainIsSvm(destinationChainId)) {
    return new sdk.relayFeeCalculator.SvmQuery(
      getSvmProvider(destinationChainId).createRpcClient(),
      baseArgs.symbolMapping,
      parsedSpokePoolAddress.forceSvmAddress(),
      parsedSimulatedRelayerAddress.forceSvmAddress(),
      baseArgs.logger,
      baseArgs.coingeckoProApiKey
    );
  }

  const customGasTokenSymbol = CUSTOM_GAS_TOKENS[destinationChainId];
  if (customGasTokenSymbol) {
    return new sdk.relayFeeCalculator.CustomGasTokenQueries({
      queryBaseArgs: [
        getProvider(destinationChainId, { useSpeedProvider: true }),
        baseArgs.symbolMapping,
        parsedSpokePoolAddress.toEvmAddress(),
        parsedSimulatedRelayerAddress.toEvmAddress(),
        baseArgs.logger,
        baseArgs.coingeckoProApiKey,
        undefined,
        "usd",
      ],
      customGasTokenSymbol,
    });
  }

  return sdk.relayFeeCalculator.QueryBase__factory.create(
    baseArgs.chainId,
    getProvider(destinationChainId, { useSpeedProvider: true }),
    baseArgs.symbolMapping,
    parsedSpokePoolAddress.toEvmAddress(),
    parsedSimulatedRelayerAddress.toEvmAddress(),
    baseArgs.coingeckoProApiKey,
    baseArgs.logger
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
  const parsedRelayerAddress = sdk.utils.toAddressType(relayerAddress);
  relayerAddress = sdk.utils.chainIsSvm(destinationChainId)
    ? parsedRelayerAddress.toBase58()
    : parsedRelayerAddress.toEvmAddress();
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
    depositId: sdk.utils.bnUint32Max,
    depositor: sdk.utils.toAddressType(recipientAddress).toBytes32(),
    recipient: sdk.utils.toAddressType(recipientAddress).toBytes32(),
    destinationChainId,
    originChainId,
    quoteTimestamp: sdk.utils.getCurrentTime() - 60, // Set the quote timestamp to 60 seconds ago ~ 1 ETH block
    inputToken,
    outputToken,
    fillDeadline: sdk.utils.bnUint32Max.toNumber(), // Defined as `INFINITE_FILL_DEADLINE` in SpokePool.sol
    exclusiveRelayer: sdk.utils
      .toAddressType(sdk.constants.ZERO_ADDRESS)
      .toBytes32(),
    exclusivityDeadline: 0, // Defined as ZERO in SpokePool.sol
    message: message ?? sdk.constants.EMPTY_MESSAGE,
    messageHash: sdk.utils.getMessageHash(
      message ?? sdk.constants.EMPTY_MESSAGE
    ),
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
  historicalDateISO?: string,
  chainId?: number
): Promise<number> => {
  return Number(
    (
      await axios(`${resolveVercelEndpoint()}/api/coingecko`, {
        params: {
          l1Token,
          chainId,
          baseCurrency,
          date: historicalDateISO,
        },
        headers: getVercelHeaders(),
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
  message?: string,
  allowUnmatchedDecimals?: boolean
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
      headers: getVercelHeaders(),
      params: {
        inputToken,
        outputToken,
        originChainId,
        destinationChainId,
        amount,
        message,
        recipient,
        relayer,
        allowUnmatchedDecimals,
      },
    })
  ).data;
};

export async function getSuggestedFees(params: {
  inputToken: string;
  outputToken: string;
  originChainId: number;
  destinationChainId: number;
  amount: string;
  skipAmountLimit?: boolean;
  message?: string;
  depositMethod?: string;
  recipient?: string;
  allowUnmatchedDecimals?: boolean;
}): Promise<{
  estimatedFillTimeSec: number;
  timestamp: number;
  isAmountTooLow: boolean;
  quoteBlock: string;
  exclusiveRelayer: string;
  exclusivityDeadline: number;
  spokePoolAddress: string;
  destinationSpokePoolAddress: string;
  totalRelayFee: {
    pct: string;
    total: string;
  };
  relayerCapitalFee: {
    pct: string;
    total: string;
  };
  relayerGasFee: {
    pct: string;
    total: string;
  };
  lpFee: {
    pct: string;
    total: string;
  };
  limits: {
    minDeposit: string;
    maxDeposit: string;
    maxDepositInstant: string;
    maxDepositShortDelay: string;
    recommendedDepositInstant: string;
  };
}> {
  return (
    await axios(`${resolveVercelEndpoint()}/api/suggested-fees`, {
      params,
    })
  ).data;
}

export async function getBridgeQuoteForExactInput(params: {
  inputToken: Token;
  outputToken: Token;
  exactInputAmount: BigNumber;
  recipient?: string;
  message?: string;
}) {
  const quote = await getSuggestedFees({
    inputToken: params.inputToken.address,
    outputToken: params.outputToken.address,
    originChainId: params.inputToken.chainId,
    destinationChainId: params.outputToken.chainId,
    skipAmountLimit: true,
    recipient: params.recipient,
    message: params.message,
    amount: params.exactInputAmount.toString(),
    allowUnmatchedDecimals: true,
  });
  const outputAmount = ConvertDecimals(
    params.inputToken.decimals,
    params.outputToken.decimals
  )(params.exactInputAmount.sub(quote.totalRelayFee.total));

  return {
    inputAmount: params.exactInputAmount,
    outputAmount,
    minOutputAmount: outputAmount,
    suggestedFees: quote,
    message: params.message,
    inputToken: params.inputToken,
    outputToken: params.outputToken,
  };
}

export async function getBridgeQuoteForMinOutput(params: {
  inputToken: Token;
  outputToken: Token;
  minOutputAmount: BigNumber;
  recipient?: string;
  message?: string;
}) {
  const maxTries = 3;
  const tryChunkSize = 3;
  const baseParams = {
    inputToken: params.inputToken.address,
    outputToken: params.outputToken.address,
    originChainId: params.inputToken.chainId,
    destinationChainId: params.outputToken.chainId,
    skipAmountLimit: true,
    recipient: params.recipient,
    message: params.message,
    allowUnmatchedDecimals: true,
  };

  try {
    // 1. Use the suggested fees to get an indicative quote with
    // input amount equal to minOutputAmount
    let tries = 0;
    let adjustedInputAmount = addMarkupToAmount(params.minOutputAmount, 0.005);
    let indicativeQuote = await getSuggestedFees({
      ...baseParams,
      amount: adjustedInputAmount.toString(),
    });
    let adjustmentPct = indicativeQuote.totalRelayFee.pct;
    let finalQuote: Awaited<ReturnType<typeof getSuggestedFees>> | undefined =
      undefined;

    // 2. Adjust input amount to meet minOutputAmount
    while (tries < maxTries) {
      const inputAmounts = Array.from({ length: tryChunkSize }).map((_, i) => {
        const buffer = 0.001 * i;
        return addMarkupToAmount(
          adjustedInputAmount
            .mul(utils.parseEther("1").add(adjustmentPct))
            .div(sdk.utils.fixedPointAdjustment),
          buffer
        );
      });
      const quotes = await Promise.all(
        inputAmounts.map((inputAmount) => {
          return getSuggestedFees({
            ...baseParams,
            amount: inputAmount.toString(),
          });
        })
      );

      for (const [i, quote] of Object.entries(quotes)) {
        const inputAmount = inputAmounts[Number(i)];
        const outputAmount = ConvertDecimals(
          params.inputToken.decimals,
          params.outputToken.decimals
        )(inputAmount.sub(quote.totalRelayFee.total));
        if (outputAmount.gte(params.minOutputAmount)) {
          finalQuote = quote;
          adjustedInputAmount = inputAmount;
          break;
        }
      }

      if (finalQuote) {
        break;
      }

      adjustedInputAmount = inputAmounts[inputAmounts.length - 1];
      tries++;
    }

    if (!finalQuote) {
      throw new Error("Failed to adjust input amount to meet minOutputAmount");
    }

    const finalOutputAmount = ConvertDecimals(
      params.inputToken.decimals,
      params.outputToken.decimals
    )(adjustedInputAmount.sub(finalQuote.totalRelayFee.total));

    return {
      inputAmount: adjustedInputAmount,
      outputAmount: finalOutputAmount,
      minOutputAmount: params.minOutputAmount,
      suggestedFees: finalQuote,
      message: params.message,
      inputToken: params.inputToken,
      outputToken: params.outputToken,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      const { response = { data: {} } } = err;
      // If upstream error is an AcrossApiError, we just return it
      if (response?.data?.type === "AcrossApiError") {
        throw new AcrossApiError(
          {
            message: response.data.message,
            status: response.data.status,
            code: response.data.code,
            param: response.data.param,
          },
          { cause: err }
        );
      } else {
        const message = `Upstream http request to ${err.request?.host} failed with ${err.response?.status}`;
        throw new AcrossApiError(
          {
            message,
            status: HttpErrorToStatusCode.BAD_GATEWAY,
            code: AcrossErrorCode.UPSTREAM_HTTP_ERROR,
          },
          { cause: err }
        );
      }
    }
    throw err;
  }
}

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

export function isInputTokenBridgeable(
  inputTokenAddress: string,
  originChainId: number,
  destinationChainId: number
) {
  return ENABLED_ROUTES.routes.some(
    ({ fromTokenAddress, fromChain, toChain }) =>
      originChainId === fromChain &&
      destinationChainId === toChain &&
      inputTokenAddress.toLowerCase() === fromTokenAddress.toLowerCase()
  );
}

export function isOutputTokenBridgeable(
  outputTokenAddress: string,
  originChainId: number,
  destinationChainId: number
) {
  return ENABLED_ROUTES.routes.some(
    ({ toTokenAddress, fromChain, toChain }) =>
      originChainId === fromChain &&
      destinationChainId === toChain &&
      toTokenAddress.toLowerCase() === outputTokenAddress.toLowerCase()
  );
}

export function getRouteByInputTokenAndDestinationChain(
  inputTokenAddress: string,
  destinationChainId: number
) {
  return ENABLED_ROUTES.routes.find(
    ({ fromTokenAddress, toChain }) =>
      destinationChainId === toChain &&
      fromTokenAddress.toLowerCase() === inputTokenAddress.toLowerCase()
  );
}

export function getRouteByOutputTokenAndOriginChain(
  outputTokenAddress: string,
  originChainId: number
) {
  return ENABLED_ROUTES.routes.find(
    ({ toTokenAddress, fromChain }) =>
      originChainId === fromChain &&
      outputTokenAddress.toLowerCase() === toTokenAddress.toLowerCase()
  );
}

export function getRoutesByChainIds(
  originChainId: number,
  destinationChainId: number
) {
  return ENABLED_ROUTES.routes.filter(
    ({ toChain, fromChain }) =>
      originChainId === fromChain && destinationChainId === toChain
  );
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
    })}`,
    {
      headers: getVercelHeaders(),
    }
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

export function validEvmAddress() {
  return define<string>("validEvmAddress", (value) => {
    try {
      return isEvmAddress(value as string);
    } catch {
      return false;
    }
  });
}

export function validSvmAddress() {
  return define<string>("validSvmAddress", (value) => {
    try {
      return isSvmAddress(value as string);
    } catch {
      return false;
    }
  });
}

export const validAddress = () => union([validEvmAddress(), validSvmAddress()]);

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
    return Number.isInteger(Number(value)) && Number(value) >= 0;
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

export function hexString() {
  return define<string>("hexString", (value) => {
    return utils.isHexString(value);
  });
}

export function bytes32() {
  return size(hexString(), 66); // inclusive of "0x"
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
      .map((key) => getEnvs()[key])
      .find((value) => value !== undefined) ?? "0"
  );
}

/**
 * Returns the limit cap for a given token and toChainId.
 * @param symbol The token symbol
 * @param decimals The token decimals
 * @param toChainId The destination chain ID
 * @returns The cap in wei
 */
export function getLimitCap(
  symbol: string,
  decimals: number,
  toChainId: number
) {
  const cap =
    [`LIMIT_CAP_${symbol}_${toChainId}`, `LIMIT_CAP_${symbol}`]
      .map((key) => getEnvs()[key])
      .find((value) => value !== undefined) ?? undefined;

  if (cap === undefined) return sdk.utils.bnUint256Max;

  return ethers.utils.parseUnits(cap, decimals);
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
  const limitsBufferMultipliers: Record<string, string> =
    LIMITS_BUFFER_MULTIPLIERS ? JSON.parse(LIMITS_BUFFER_MULTIPLIERS) : {};
  const bufferMultiplier = ethers.utils.parseEther(
    limitsBufferMultipliers[symbol] || "0.8"
  );
  const multiplierCap = ethers.utils.parseEther("1");
  return minBN(bufferMultiplier, multiplierCap);
}

export function getChainInputTokenMaxBalanceInUsd(
  chainId: number,
  symbol: string,
  includeDefault: boolean
) {
  const maxBalances: Record<
    string,
    Record<string, string>
  > = CHAIN_USD_MAX_BALANCES ? JSON.parse(CHAIN_USD_MAX_BALANCES) : {};
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
  const maxDeposits: Record<
    string,
    Record<string, string>
  > = CHAIN_USD_MAX_DEPOSITS ? JSON.parse(CHAIN_USD_MAX_DEPOSITS) : {};
  const defaultValue = includeDefault
    ? DEFAULT_LITE_CHAIN_USD_MAX_DEPOSIT
    : undefined;

  return (
    maxDeposits[chainId.toString()]?.[symbol] ?? // specific chain => specific token
    maxDeposits["*"]?.[symbol] ?? // all chains for specific token
    maxDeposits["*"]?.["*"] ?? // all tokens for all chains
    defaultValue // default
  );
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
      if (sdk.utils.chainIsSvm(chainId)) {
        return false;
      }
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
  // Set this longer than the secondsPerUpdate value in the cron cache gas prices job.
  const ttlPerChain = {
    default: 120,
  };
  const cacheKey = buildInternalCacheKey(
    "nativeGasCost",
    deposit.destinationChainId,
    deposit.outputToken
  );
  const fetchFn = async () => {
    const relayerAddress =
      overrides?.relayerAddress ??
      getDefaultRelayerAddress(deposit.destinationChainId);
    const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
      deposit.destinationChainId,
      { relayerAddress }
    );
    const gasCost = await relayerFeeCalculatorQueries.getNativeGasCost(
      buildDepositForSimulation(deposit),
      relayerFeeCalculatorQueries.simulatedRelayerAddress as string | undefined
    );
    return gasCost;
  };

  return makeCacheGetterAndSetter(
    cacheKey,
    ttlPerChain.default,
    fetchFn,
    (nativeGasCostFromCache) => {
      return BigNumber.from(nativeGasCostFromCache);
    }
  );
}

export function getCachedOpStackL1DataFee(
  deposit: Parameters<typeof buildDepositForSimulation>[0],
  nativeGasCost: BigNumber,
  overrides?: Partial<{
    relayerAddress: string;
  }>
) {
  // The L1 data fee should change after each Ethereum block since its based on the L1 base fee.
  // However, the L1 base fee should only change by 12.5% at most per block.
  // We set this higher than the secondsPerUpdate value in the cron cache gas prices job which will update this
  // more frequently.
  const ttlPerChain = {
    default: 60,
  };

  const cacheKey = buildInternalCacheKey(
    "opStackL1DataFee",
    deposit.destinationChainId,
    deposit.outputToken // This should technically differ based on the output token since the L2 calldata
    // size affects the L1 data fee and this calldata can differ based on the output token.
  );
  const fetchFn = async () => {
    // We don't care about the gas token price or the token gas price, only the raw gas units. In the API
    // we'll compute the gas price separately.
    const { opStackL1DataFeeMarkup } = getGasMarkup(deposit.destinationChainId);
    const relayerFeeCalculatorQueries = getRelayerFeeCalculatorQueries(
      deposit.destinationChainId,
      overrides
    );
    if (
      relayerFeeCalculatorQueries instanceof sdk.relayFeeCalculator.SvmQuery
    ) {
      return undefined;
    }
    const unsignedTx =
      await relayerFeeCalculatorQueries.getUnsignedTxFromDeposit(
        buildDepositForSimulation(deposit),
        relayerFeeCalculatorQueries.simulatedRelayerAddress as
          | string
          | undefined
      );
    const opStackL1GasCost =
      await relayerFeeCalculatorQueries.getOpStackL1DataFee(
        unsignedTx,
        relayerFeeCalculatorQueries.simulatedRelayerAddress as
          | string
          | undefined,
        {
          opStackL2GasUnits: nativeGasCost, // Passed in here to avoid gas cost recomputation by the SDK
          opStackL1DataFeeMultiplier: opStackL1DataFeeMarkup,
        }
      );
    return opStackL1GasCost;
  };

  return makeCacheGetterAndSetter(
    cacheKey,
    ttlPerChain.default,
    fetchFn,
    (l1DataFeeFromCache) => {
      return BigNumber.from(l1DataFeeFromCache);
    }
  );
}

export function latestGasPriceCache(
  chainId: number,
  deposit?: Parameters<typeof buildDepositForSimulation>[0],
  overrides?: Partial<{
    relayerAddress: string;
  }>
) {
  // We set this higher than the secondsPerUpdate value in the cron cache gas prices job which will update this
  // more frequently.
  const ttlPerChain = {
    default: 30,
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
    () => getGasPriceEstimate(chainId, deposit, overrides),
    (gasPrice: sdk.gasPriceOracle.GasPriceEstimate) => {
      const evmGasPrice = gasPrice as sdk.gasPriceOracle.EvmGasPriceEstimate;
      const svmGasPrice = gasPrice as sdk.gasPriceOracle.SvmGasPriceEstimate;
      if (evmGasPrice.maxFeePerGas && evmGasPrice.maxPriorityFeePerGas) {
        return {
          maxFeePerGas: BigNumber.from(evmGasPrice.maxFeePerGas),
          maxPriorityFeePerGas: BigNumber.from(
            evmGasPrice.maxPriorityFeePerGas
          ),
        };
      } else {
        return {
          baseFee: BigNumber.from(svmGasPrice.baseFee),
          microLamportsPerComputeUnit: BigNumber.from(
            svmGasPrice.microLamportsPerComputeUnit
          ),
        };
      }
    }
  );
}

export async function getGasPriceEstimate(
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
  const isSvm =
    relayerFeeCalculatorQueries instanceof sdk.relayFeeCalculator.SvmQuery;
  const unsignedFillTxn = deposit
    ? isSvm
      ? await relayerFeeCalculatorQueries.getFillRelayTx(
          buildDepositForSimulation(deposit),
          overrides?.relayerAddress
        )
      : await relayerFeeCalculatorQueries.getUnsignedTxFromDeposit(
          buildDepositForSimulation(deposit),
          overrides?.relayerAddress
        )
    : undefined;
  return sdk.gasPriceOracle.getGasPriceEstimate(
    relayerFeeCalculatorQueries.provider as Parameters<
      typeof sdk.gasPriceOracle.getGasPriceEstimate
    >[0], // we don't need a narrow return type here
    {
      chainId,
      unsignedTx: unsignedFillTxn,
      baseFeeMultiplier,
      priorityFeeMultiplier,
    }
  );
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
  params: Record<
    string,
    number | string | boolean | Array<number | string | boolean>
  >
): string {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null) continue;
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

export type TokenOptions = {
  chainId: number;
  address: string;
};

const TTL_TOKEN_INFO = 30 * 24 * 60 * 60; // 30 days

function tokenInfoCache(params: TokenOptions) {
  return makeCacheGetterAndSetter(
    buildInternalCacheKey("tokenInfo", params.address, params.chainId),
    TTL_TOKEN_INFO,
    () => getTokenInfo(params),
    (tokenDetails) => tokenDetails
  );
}

export async function getCachedTokenInfo(params: TokenOptions) {
  return tokenInfoCache(params).get();
}

// find decimals and symbol for any token address on any chain we support
export async function getTokenInfo({ chainId, address }: TokenOptions): Promise<
  Pick<TokenInfo, "address" | "name" | "symbol" | "decimals"> & {
    chainId: number;
  }
> {
  try {
    if (!ethers.utils.isAddress(address)) {
      throw new InvalidParamError({
        param: "address",
        message: '"Address" must be a valid ethereum address',
      });
    }

    if (!Number.isSafeInteger(chainId) || chainId < 0) {
      throw new InvalidParamError({
        param: "chainId",
        message: '"chainId" must be a positive integer',
      });
    }

    // ERC20 resolved statically
    const token = Object.values(TOKEN_SYMBOLS_MAP).find((token) =>
      Boolean(
        token.addresses?.[chainId]?.toLowerCase() === address.toLowerCase()
      )
    );

    if (token) {
      return {
        decimals: token.decimals,
        symbol: token.symbol,
        address: token.addresses[chainId],
        name: token.name,
        chainId,
      };
    }

    // ERC20 resolved dynamically
    const provider = getProvider(chainId);

    const erc20 = ERC20__factory.connect(
      ethers.utils.getAddress(address),
      provider
    );

    const calls = [
      {
        contract: erc20,
        functionName: "decimals",
      },
      {
        contract: erc20,
        functionName: "symbol",
      },
      {
        contract: erc20,
        functionName: "name",
      },
    ];

    const [[decimals], [symbol], [name]] = await callViaMulticall3(
      provider,
      calls
    );

    return {
      address,
      decimals,
      symbol,
      name,
      chainId,
    };
  } catch (error) {
    throw new TokenNotFoundError({
      chainId,
      address,
      opts: {
        cause: error,
      },
    });
  }
}

export function getL1TokenConfigCache(l1TokenAddress: string) {
  l1TokenAddress = utils.getAddress(l1TokenAddress);
  const cacheKey = buildInternalCacheKey("l1TokenConfig", l1TokenAddress);
  const fetchFn = async () => {
    const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
      ENABLED_ROUTES.acrossConfigStoreAddress,
      getProvider(HUB_POOL_CHAIN_ID)
    );
    const l1TokenConfig =
      await configStoreClient.getL1TokenConfig(l1TokenAddress);
    return l1TokenConfig;
  };
  const ttl = 60 * 60 * 24 * 30; // 30 days
  return makeCacheGetterAndSetter(cacheKey, ttl, fetchFn);
}

export function addMarkupToAmount(amount: BigNumber, markup = 0.01) {
  return amount
    .mul(ethers.utils.parseEther((1 + Number(markup)).toString()))
    .div(sdk.utils.fixedPointAdjustment);
}

export function parseL1TokenConfigSafe(jsonString: string) {
  try {
    // This implies that the L1 token config is not set for the given token address.
    // We should return a default rate model in this case.
    if (jsonString === "") {
      return {
        rateModel: {
          UBar: ethers.utils.parseUnits("0.01").toString(),
          R0: "0",
          R1: "0",
          R2: "0",
        },
      };
    }
    return sdk.contracts.acrossConfigStore.Client.parseL1TokenConfig(
      jsonString
    );
  } catch (error) {
    getLogger().error({
      at: "parseL1TokenConfigSafe",
      message: "Error parsing L1 token config",
      error,
      jsonString,
    });
    return null;
  }
}

// Copied from @uma/common
/**
 * Factory function that creates a function that converts an amount from one number of decimals to another.
 * Copied from @uma/common
 * @param fromDecimals The number of decimals of the input amount.
 * @param toDecimals The number of decimals of the output amount.
 * @returns A function that converts an amount from `fromDecimals` to `toDecimals`.
 */
export const ConvertDecimals = (fromDecimals: number, toDecimals: number) => {
  return (amount: BigNumber): BigNumber => {
    amount = BigNumber.from(amount);
    if (amount.isZero()) return amount;
    const diff = fromDecimals - toDecimals;
    if (diff === 0) return amount;
    if (diff > 0) return amount.div(BigNumber.from("10").pow(diff));
    return amount.mul(BigNumber.from("10").pow(-1 * diff));
  };
};
