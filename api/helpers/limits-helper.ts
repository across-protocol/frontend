import * as sdk from "@across-protocol/sdk";
import { VercelRequestQuery } from "@vercel/node";
import { BigNumber, ethers } from "ethers";
import { CHAIN_IDs, CUSTOM_GAS_TOKENS } from "../_constants";
import { TokenInfo } from "../_types";
import { assert } from "superstruct";

import {
  ENABLED_ROUTES,
  HUB_POOL_CHAIN_ID,
  callViaMulticall3,
  ConvertDecimals,
  getCachedTokenBalance,
  getCachedTokenPrice,
  getHubPool,
  getLimitsBufferMultiplier,
  getChainInputTokenMaxBalanceInUsd,
  getChainInputTokenMaxDepositInUsd,
  getLpCushion,
  getProvider,
  getSpokePoolAddress,
  maxBN,
  minBN,
  validateChainAndTokenParams,
  getCachedLatestBlock,
  latestGasPriceCache,
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
} from "../_utils";
import { getEnvs } from "../_env";
import {
  getDefaultRelayerAddress,
  getFullRelayers,
  getTransferRestrictedRelayers,
} from "../_relayer-address";
import { getDefaultRecipientAddress } from "../_recipient-address";
import { LimitsQueryParamsSchema } from "../limits";

interface ValidatedAndInitializedParams {
  provider: ethers.providers.StaticJsonRpcProvider;
  destinationChainId: number;
  computedOriginChainId: number;
  l1Token: TokenInfo;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  amount: BigNumber;
  recipient: sdk.utils.Address;
  relayer: sdk.utils.Address;
  message?: string;
  isMessageDefined: boolean;
  minDepositUsdForDestinationChainId: number;
}

export async function validateAndInitialize(
  query: VercelRequestQuery
): Promise<ValidatedAndInitializedParams> {
  const { MIN_DEPOSIT_USD } = getEnvs();
  const provider = getProvider(HUB_POOL_CHAIN_ID);

  assert(query, LimitsQueryParamsSchema);

  const {
    destinationChainId,
    resolvedOriginChainId: computedOriginChainId,
    l1Token,
    inputToken,
    outputToken,
  } = validateChainAndTokenParams(query);

  // Optional parameters that caller can use to specify specific deposit details with which
  // to compute limits.
  let {
    amount: amountInput,
    recipient: _recipient,
    relayer: _relayer,
    message,
  } = query;
  const recipient = sdk.utils.toAddressType(
    _recipient || getDefaultRecipientAddress(destinationChainId)
  );
  const relayer = sdk.utils.toAddressType(
    _relayer || getDefaultRelayerAddress(destinationChainId, l1Token.symbol)
  );

  const isMessageDefined = sdk.utils.isDefined(message);
  const amount = BigNumber.from(
    amountInput ?? ethers.BigNumber.from("10").pow(inputToken.decimals)
  );
  let minDepositUsdForDestinationChainId = Number(
    getEnvs()[`MIN_DEPOSIT_USD_${destinationChainId}`] ?? MIN_DEPOSIT_USD
  );
  if (isNaN(minDepositUsdForDestinationChainId)) {
    minDepositUsdForDestinationChainId = 0;
  }

  return {
    provider,
    destinationChainId,
    computedOriginChainId,
    l1Token,
    inputToken,
    outputToken,
    amount,
    recipient,
    relayer,
    message,
    isMessageDefined,
    minDepositUsdForDestinationChainId,
  };
}

interface MulticallSetup {
  multiCalls: Array<{
    contract: ethers.Contract;
    functionName: string;
    args: any[];
  }>;
}

export function setupMulticall(
  provider: ethers.providers.Provider,
  l1Token: TokenInfo,
  computedOriginChainId: number,
  destinationChainId: number
): MulticallSetup {
  const hubPool = getHubPool(provider);
  const configStoreClient = new sdk.contracts.acrossConfigStore.Client(
    ENABLED_ROUTES.acrossConfigStoreAddress,
    provider
  );
  const liteChainsKey =
    sdk.clients.GLOBAL_CONFIG_STORE_KEYS.LITE_CHAIN_ID_INDICES;
  const encodedLiteChainsKey = sdk.utils.utf8ToHex(liteChainsKey);

  const multiCalls = [
    { contract: hubPool, functionName: "sync", args: [l1Token.address] },
    {
      contract: hubPool,
      functionName: "pooledTokens",
      args: [l1Token.address],
    },
    {
      contract: configStoreClient.contract,
      functionName: "globalConfig",
      args: [encodedLiteChainsKey],
    },
    {
      contract: hubPool,
      functionName: "poolRebalanceRoute",
      args: [computedOriginChainId, l1Token.address],
    },
    {
      contract: hubPool,
      functionName: "poolRebalanceRoute",
      args: [destinationChainId, l1Token.address],
    },
  ];

  return {
    multiCalls,
  };
}

interface DepositAndGasSetup {
  depositArgs: {
    amount: BigNumber;
    inputToken: string;
    outputToken: string;
    recipientAddress: string;
    originChainId: number;
    destinationChainId: number;
    message?: string;
  };
  shouldUseUnsignedFillForGasPriceCache: boolean;
}

export function setupDepositAndGas(
  amount: BigNumber,
  inputToken: TokenInfo,
  outputToken: TokenInfo,
  recipient: sdk.utils.Address,
  computedOriginChainId: number,
  destinationChainId: number,
  message?: string
): DepositAndGasSetup {
  const depositArgs = {
    amount,
    inputToken: sdk.utils.toAddressType(inputToken.address).toBytes32(),
    outputToken: sdk.utils.toAddressType(outputToken.address).toBytes32(),
    recipientAddress: recipient.toBytes32(),
    originChainId: computedOriginChainId,
    destinationChainId,
    message,
  };

  // We only want to derive an unsigned fill txn from the deposit args if the
  // destination chain is Linea or Solana:
  // - Linea: Priority fee depends on the destination chain call data
  // - Solana: Compute units estimation fails for missing values
  const shouldUseUnsignedFillForGasPriceCache =
    destinationChainId === CHAIN_IDs.LINEA ||
    sdk.utils.chainIsSvm(destinationChainId);

  return {
    depositArgs,
    shouldUseUnsignedFillForGasPriceCache,
  };
}

interface TokenAndGasPrices {
  tokenPriceNative: number;
  tokenPriceUsd: sdk.utils.BigNumber;
  latestBlock: ethers.providers.Block;
  gasPriceEstimate: sdk.gasPriceOracle.GasPriceEstimate;
  nativeGasCost?: sdk.utils.BigNumber;
}

export async function fetchTokenAndGasPrices(
  provider: ethers.providers.StaticJsonRpcProvider,
  l1Token: TokenInfo,
  destinationChainId: number,
  depositArgs: DepositAndGasSetup["depositArgs"],
  shouldUseUnsignedFillForGasPriceCache: boolean,
  relayer: sdk.utils.Address,
  isMessageDefined: boolean
): Promise<TokenAndGasPrices> {
  const [
    tokenPriceNative,
    _tokenPriceUsd,
    latestBlock,
    gasPriceEstimate,
    nativeGasCost,
  ] = await Promise.all([
    getCachedTokenPrice(
      l1Token.address,
      CUSTOM_GAS_TOKENS[destinationChainId]?.toLowerCase() ??
        sdk.utils.getNativeTokenSymbol(destinationChainId).toLowerCase()
    ),
    getCachedTokenPrice(l1Token.address, "usd"),
    getCachedLatestBlock(HUB_POOL_CHAIN_ID),
    latestGasPriceCache(
      destinationChainId,
      shouldUseUnsignedFillForGasPriceCache ? depositArgs : undefined,
      {
        relayerAddress: relayer.toBytes32(),
      }
    ).get(),
    isMessageDefined
      ? undefined // Only use cached gas units if message is not defined, i.e. standard for standard bridges
      : getCachedNativeGasCost(depositArgs, {
          relayerAddress: relayer.toBytes32(),
        }).get(),
  ]);

  const tokenPriceUsd = ethers.utils.parseUnits(_tokenPriceUsd.toString());

  return {
    tokenPriceNative,
    tokenPriceUsd,
    latestBlock,
    gasPriceEstimate,
    nativeGasCost,
  };
}

interface RelayerBalances {
  _liquidReserves: BigNumber;
  fullRelayerBalances: BigNumber[];
  transferRestrictedBalances: BigNumber[];
  transferBalances: BigNumber[];
  routeInvolvesLiteChain: boolean;
  routeInvolvesUltraLightChain: boolean;
  opStackL1GasCost?: sdk.utils.BigNumber;
}

export async function processRelayerBalances(
  provider: ethers.providers.StaticJsonRpcProvider,
  multiCalls: Array<{
    contract: ethers.Contract;
    functionName: string;
    args: any[];
  }>,
  latestBlock: { number: number },
  l1Token: TokenInfo,
  inputToken: TokenInfo,
  outputToken: TokenInfo,
  computedOriginChainId: number,
  destinationChainId: number,
  fullRelayersDestinationChain: string[],
  transferRestrictedRelayersDestinationChain: string[],
  fullRelayersL1: string[],
  depositArgs: DepositAndGasSetup["depositArgs"],
  relayer: sdk.utils.Address,
  nativeGasCost?: BigNumber
): Promise<RelayerBalances> {
  const [
    opStackL1GasCost,
    multicallOutput,
    _fullRelayerBalances,
    _transferRestrictedBalances,
    _fullRelayerMainnetBalances,
  ] = await Promise.all([
    nativeGasCost && sdk.utils.chainIsOPStack(destinationChainId)
      ? // Only use cached gas units if message is not defined, i.e. standard for standard bridges
        getCachedOpStackL1DataFee(depositArgs, nativeGasCost, {
          relayerAddress: relayer.toBytes32(),
        }).get()
      : undefined,
    callViaMulticall3(provider, multiCalls, {
      blockTag: latestBlock.number,
    }),
    Promise.all(
      fullRelayersDestinationChain.map((relayer) =>
        getCachedTokenBalance(destinationChainId, relayer, outputToken.address)
      )
    ),
    Promise.all(
      transferRestrictedRelayersDestinationChain.map((relayer) =>
        getCachedTokenBalance(destinationChainId, relayer, outputToken.address)
      )
    ),
    Promise.all(
      fullRelayersL1.map((relayer) =>
        destinationChainId === HUB_POOL_CHAIN_ID
          ? ethers.BigNumber.from("0")
          : getCachedTokenBalance(HUB_POOL_CHAIN_ID, relayer, l1Token.address)
      )
    ),
  ]);

  const { liquidReserves: _liquidReserves } = multicallOutput[1];
  const [liteChainIdsEncoded] = multicallOutput[2];
  const [poolRebalanceRouteOrigin] = multicallOutput[3];
  const [poolRebalanceRouteDestination] = multicallOutput[4];

  const liteChainIds: number[] =
    liteChainIdsEncoded === "" ? [] : JSON.parse(liteChainIdsEncoded);
  const originChainIsLiteChain = liteChainIds.includes(computedOriginChainId);
  const destinationChainIsLiteChain = liteChainIds.includes(destinationChainId);
  const routeInvolvesLiteChain =
    originChainIsLiteChain || destinationChainIsLiteChain;

  const originChainIsUltraLightChain =
    poolRebalanceRouteOrigin === ethers.constants.AddressZero;
  const destinationChainIsUltraLightChain =
    poolRebalanceRouteDestination === ethers.constants.AddressZero;
  const routeInvolvesUltraLightChain =
    originChainIsUltraLightChain || destinationChainIsUltraLightChain;

  return {
    _liquidReserves,
    fullRelayerBalances: _fullRelayerBalances,
    transferRestrictedBalances: _transferRestrictedBalances,
    transferBalances: _fullRelayerBalances,
    routeInvolvesLiteChain,
    routeInvolvesUltraLightChain,
    opStackL1GasCost,
  };
}
interface ProcessedRelayerBalances {
  _liquidReserves: BigNumber;
  fullRelayerBalances: BigNumber[];
  transferRestrictedBalances: BigNumber[];
  fullRelayerMainnetBalances: BigNumber[];
}

interface TokenDecimals {
  l1TokenDecimals: number;
  inputTokenDecimals: number;
  outputTokenDecimals: number;
}

interface ConvertedRelayerBalances {
  convertedLiquidReserves: BigNumber;
  convertedFullRelayerBalances: BigNumber[];
  convertedTransferRestrictedBalances: BigNumber[];
  convertedTransferBalances: BigNumber[];
}

export function convertRelayerBalancesToInputDecimals(
  balances: ProcessedRelayerBalances,
  decimals: TokenDecimals
): ConvertedRelayerBalances {
  const {
    _liquidReserves,
    fullRelayerBalances,
    transferRestrictedBalances,
    fullRelayerMainnetBalances,
  } = balances;
  const { l1TokenDecimals, inputTokenDecimals, outputTokenDecimals } = decimals;

  // Base every amount on the input token decimals.
  let liquidReserves = ConvertDecimals(
    l1TokenDecimals,
    inputTokenDecimals
  )(_liquidReserves);
  const convertedFullRelayerBalances = fullRelayerBalances.map((balance) =>
    ConvertDecimals(outputTokenDecimals, inputTokenDecimals)(balance)
  );
  const convertedFullRelayerMainnetBalances = fullRelayerMainnetBalances.map(
    (balance) => ConvertDecimals(l1TokenDecimals, inputTokenDecimals)(balance)
  );
  const convertedTransferRestrictedBalances = transferRestrictedBalances.map(
    (balance) =>
      ConvertDecimals(outputTokenDecimals, inputTokenDecimals)(balance)
  );

  const transferBalances = convertedFullRelayerBalances.map((balance, i) =>
    balance.add(convertedFullRelayerMainnetBalances[i])
  );

  return {
    convertedLiquidReserves: liquidReserves,
    convertedFullRelayerBalances,
    convertedTransferRestrictedBalances,
    convertedTransferBalances: transferBalances,
  };
}
interface ChainBoundariesAndDeposits {
  minDeposit: BigNumber;
  minDepositFloor: BigNumber;
  maxDepositInstant: BigNumber;
  maxDepositShortDelay: BigNumber;
  maximumDeposit: BigNumber;
}

export async function processChainBoundariesAndDeposits(
  provider: ethers.providers.StaticJsonRpcProvider,
  l1Token: TokenInfo,
  inputToken: TokenInfo,
  computedOriginChainId: number,
  destinationChainId: number,
  tokenPriceUsd: BigNumber,
  minDeposit: BigNumber,
  minDepositFloor: BigNumber,
  maxDepositInstant: BigNumber,
  maxDepositShortDelay: BigNumber,
  liquidReserves: BigNumber,
  routeInvolvesLiteChain: boolean,
  routeInvolvesUltraLightChain: boolean
): Promise<ChainBoundariesAndDeposits> {
  // Apply chain max values when defined
  const includeDefaultMaxValues =
    routeInvolvesLiteChain || routeInvolvesUltraLightChain;
  const includeRelayerBalances =
    routeInvolvesLiteChain || routeInvolvesUltraLightChain;
  let chainAvailableInputTokenAmountForDeposits: BigNumber | undefined;
  let chainInputTokenMaxDeposit: BigNumber | undefined;
  let chainHasMaxBoundary: boolean = false;

  const chainInputTokenMaxBalanceInUsd = getChainInputTokenMaxBalanceInUsd(
    computedOriginChainId,
    inputToken.symbol,
    includeDefaultMaxValues
  );

  const chainInputTokenMaxDepositInUsd = getChainInputTokenMaxDepositInUsd(
    computedOriginChainId,
    inputToken.symbol,
    includeDefaultMaxValues
  );

  if (chainInputTokenMaxBalanceInUsd) {
    const chainInputTokenMaxBalance = parseAndConvertUsdToTokenUnits(
      chainInputTokenMaxBalanceInUsd,
      tokenPriceUsd,
      inputToken
    );
    const fullRelayersOriginChain = getFullRelayers(computedOriginChainId);
    const transferRestrictedRelayersOriginChain = getTransferRestrictedRelayers(
      computedOriginChainId,
      l1Token.symbol
    );
    const relayers = includeRelayerBalances
      ? [...fullRelayersOriginChain, ...transferRestrictedRelayersOriginChain]
      : [];
    chainAvailableInputTokenAmountForDeposits =
      await getAvailableAmountForDeposits(
        computedOriginChainId,
        inputToken,
        chainInputTokenMaxBalance,
        relayers
      );
    chainHasMaxBoundary = true;
  }

  if (chainInputTokenMaxDepositInUsd) {
    chainInputTokenMaxDeposit = parseAndConvertUsdToTokenUnits(
      chainInputTokenMaxDepositInUsd,
      tokenPriceUsd,
      inputToken
    );
    chainHasMaxBoundary = true;
  }

  const bnOrMax = (value?: BigNumber) => value ?? ethers.constants.MaxUint256;
  const resolvedChainAvailableAmountForDeposits = bnOrMax(
    chainAvailableInputTokenAmountForDeposits
  );
  const resolvedChainInputTokenMaxDeposit = bnOrMax(chainInputTokenMaxDeposit);

  const chainMaxBoundary = minBN(
    resolvedChainAvailableAmountForDeposits,
    resolvedChainInputTokenMaxDeposit
  );

  minDeposit = minBN(minDeposit, chainMaxBoundary);
  minDepositFloor = minBN(minDepositFloor, chainMaxBoundary);
  maxDepositInstant = minBN(maxDepositInstant, chainMaxBoundary);
  maxDepositShortDelay = minBN(maxDepositShortDelay, chainMaxBoundary);

  const limitsBufferMultiplier = getLimitsBufferMultiplier(l1Token.symbol);

  // Apply multipliers
  const bufferedRecommendedDepositInstant = limitsBufferMultiplier
    .mul(maxDepositInstant)
    .div(sdk.utils.fixedPointAdjustment);
  const bufferedMaxDepositInstant = limitsBufferMultiplier
    .mul(maxDepositInstant)
    .div(sdk.utils.fixedPointAdjustment);
  const bufferedMaxDepositShortDelay = limitsBufferMultiplier
    .mul(maxDepositShortDelay)
    .div(sdk.utils.fixedPointAdjustment);

  let maximumDeposit = getMaxDeposit(
    liquidReserves,
    bufferedMaxDepositShortDelay,
    limitsBufferMultiplier,
    chainHasMaxBoundary,
    routeInvolvesLiteChain || routeInvolvesUltraLightChain
  );

  if (
    (destinationChainId === CHAIN_IDs.ZK_SYNC &&
      computedOriginChainId === CHAIN_IDs.MAINNET) ||
    inputToken.symbol.toUpperCase() === "POOL"
  ) {
    maximumDeposit = liquidReserves;
  }

  return {
    minDeposit,
    minDepositFloor,
    maxDepositInstant: bufferedMaxDepositInstant,
    maxDepositShortDelay: bufferedMaxDepositShortDelay,
    maximumDeposit,
  };
}

interface DepositLimits {
  minDeposit: BigNumber;
  minDepositFloor: BigNumber;
  maxDepositInstant: BigNumber;
  maxDepositShortDelay: BigNumber;
  liquidReserves: BigNumber;
}

export function getDepositLimits(
  relayerFeeDetails: {
    minDeposit: string;
  },
  tokenPriceUsd: BigNumber,
  minDepositUsdForDestinationChainId: number,
  inputToken: TokenInfo,
  fullRelayerBalances: BigNumber[],
  transferRestrictedBalances: BigNumber[],
  transferBalances: BigNumber[],
  _liquidReserves: BigNumber,
  l1Token: TokenInfo,
  computedOriginChainId: number,
  destinationChainId: number,
  routeInvolvesLiteChain: boolean,
  routeInvolvesUltraLightChain: boolean
): DepositLimits {
  let minDeposit = ethers.BigNumber.from(relayerFeeDetails.minDeposit);

  // Normalise the environment-set USD minimum to units of the token being bridged.
  let minDepositFloor = tokenPriceUsd.lte(0)
    ? ethers.BigNumber.from(0)
    : ethers.utils
        .parseUnits(
          minDepositUsdForDestinationChainId.toString(),
          inputToken.decimals
        )
        .mul(ethers.utils.parseUnits("1"))
        .div(tokenPriceUsd);

  let maxDepositInstant = maxBN(
    ...fullRelayerBalances,
    ...transferRestrictedBalances
  ); // balances on destination chain

  let maxDepositShortDelay = maxBN(
    ...transferBalances,
    ...transferRestrictedBalances
  ); // balances on destination chain + mainnet

  let liquidReserves = _liquidReserves;
  if (!routeInvolvesLiteChain && !routeInvolvesUltraLightChain) {
    const _lpCushion = ethers.utils.parseUnits(
      getLpCushion(l1Token.symbol, computedOriginChainId, destinationChainId),
      l1Token.decimals
    );
    const lpCushion = ConvertDecimals(
      l1Token.decimals,
      inputToken.decimals
    )(_lpCushion);
    liquidReserves = maxBN(
      liquidReserves.sub(lpCushion),
      ethers.BigNumber.from(0)
    );

    maxDepositInstant = minBN(maxDepositInstant, liquidReserves);
    maxDepositShortDelay = minBN(maxDepositShortDelay, liquidReserves);
  }

  return {
    minDeposit,
    minDepositFloor,
    maxDepositInstant,
    maxDepositShortDelay,
    liquidReserves,
  };
}

const getAvailableAmountForDeposits = async (
  originChainId: number,
  inputToken: TokenInfo,
  chainTokenMaxBalance: BigNumber,
  relayers: string[]
): Promise<BigNumber> => {
  const originSpokePoolAddress = getSpokePoolAddress(originChainId);
  const [originSpokePoolBalance, ...originChainBalancesPerRelayer] =
    await Promise.all([
      getCachedTokenBalance(
        originChainId,
        originSpokePoolAddress,
        inputToken.address
      ),
      ...relayers.map((relayer) =>
        getCachedTokenBalance(originChainId, relayer, inputToken.address)
      ),
    ]);
  const currentTotalChainBalance = originChainBalancesPerRelayer.reduce(
    (totalBalance, relayerBalance) => totalBalance.add(relayerBalance),
    originSpokePoolBalance
  );
  const chainAvailableAmountForDeposits = currentTotalChainBalance.gte(
    chainTokenMaxBalance
  )
    ? sdk.utils.bnZero
    : chainTokenMaxBalance.sub(currentTotalChainBalance);
  return chainAvailableAmountForDeposits;
};

const getMaxDeposit = (
  liquidReserves: BigNumber,
  bufferedMaxDepositShortDelay: BigNumber,
  limitsBufferMultiplier: BigNumber,
  chainHasMaxBoundary: boolean,
  routeInvolvesLiteChain: boolean
): BigNumber => {
  // We set `maxDeposit` equal to `maxDepositShortDelay` to be backwards compatible
  // but still prevent users from depositing more than the `maxDepositShortDelay`,
  // only if buffer multiplier is set to 100% and origin chain doesn't have an explicit max limit
  const isBufferMultiplierOne = limitsBufferMultiplier.eq(
    ethers.utils.parseEther("1")
  );
  if (isBufferMultiplierOne && !routeInvolvesLiteChain) {
    if (chainHasMaxBoundary)
      return minBN(liquidReserves, bufferedMaxDepositShortDelay);
    return liquidReserves;
  }
  return bufferedMaxDepositShortDelay;
};

const parseAndConvertUsdToTokenUnits = (
  usdValue: string,
  tokenPriceUsd: BigNumber,
  inputToken: TokenInfo
): BigNumber => {
  const usdValueInWei = ethers.utils.parseUnits(usdValue);
  const tokenValueInWei = usdValueInWei
    .mul(sdk.utils.fixedPointAdjustment)
    .div(tokenPriceUsd);
  const tokenValue = ConvertDecimals(18, inputToken.decimals)(tokenValueInWei);
  return sdk.utils.toBN(tokenValue);
};
