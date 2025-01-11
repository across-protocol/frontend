import * as sdk from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import { BigNumber, ethers } from "ethers";
import { CHAIN_IDs, DEFAULT_SIMULATED_RECIPIENT_ADDRESS } from "./_constants";
import { TokenInfo, TypedVercelRequest } from "./_types";
import { object, assert, Infer, optional, string } from "superstruct";

import {
  ENABLED_ROUTES,
  HUB_POOL_CHAIN_ID,
  callViaMulticall3,
  ConvertDecimals,
  getCachedTokenBalance,
  getCachedTokenPrice,
  getDefaultRelayerAddress,
  getHubPool,
  getLimitsBufferMultiplier,
  getChainInputTokenMaxBalanceInUsd,
  getChainInputTokenMaxDepositInUsd,
  getLogger,
  getLpCushion,
  getProvider,
  getRelayerFeeDetails,
  getSpokePoolAddress,
  handleErrorCondition,
  maxBN,
  minBN,
  positiveIntStr,
  sendResponse,
  validAddress,
  validateChainAndTokenParams,
  getCachedLatestBlock,
  parsableBigNumberString,
  validateDepositMessage,
  getCachedFillGasUsage,
  latestGasPriceCache,
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
} from "./_utils";
import { MissingParamError } from "./_errors";
import { bnZero } from "utils";

const LimitsQueryParamsSchema = object({
  token: optional(validAddress()),
  inputToken: optional(validAddress()),
  outputToken: optional(validAddress()),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
  amount: optional(parsableBigNumberString()),
  message: optional(string()),
  recipient: optional(validAddress()),
  relayer: optional(validAddress()),
});

type LimitsQueryParams = Infer<typeof LimitsQueryParamsSchema>;

const handler = async (
  { query }: TypedVercelRequest<LimitsQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Limits",
    message: "Query data",
    query,
  });
  try {
    const {
      REACT_APP_FULL_RELAYERS, // These are relayers running a full auto-rebalancing strategy.
      REACT_APP_TRANSFER_RESTRICTED_RELAYERS, // These are relayers whose funds stay put.
      MIN_DEPOSIT_USD, // The global minimum deposit in USD for all destination chains. The minimum deposit
      // returned by the relayerFeeDetails() call will be floor'd with this value (after converting to token units).
    } = process.env;
    const provider = getProvider(HUB_POOL_CHAIN_ID);

    const fullRelayers = !REACT_APP_FULL_RELAYERS
      ? []
      : (JSON.parse(REACT_APP_FULL_RELAYERS) as string[]).map((relayer) => {
          return ethers.utils.getAddress(relayer);
        });
    const transferRestrictedRelayers = !REACT_APP_TRANSFER_RESTRICTED_RELAYERS
      ? []
      : (JSON.parse(REACT_APP_TRANSFER_RESTRICTED_RELAYERS) as string[]).map(
          (relayer) => {
            return ethers.utils.getAddress(relayer);
          }
        );

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
    let { amount: amountInput, recipient, relayer, message } = query;
    recipient = recipient
      ? ethers.utils.getAddress(recipient)
      : DEFAULT_SIMULATED_RECIPIENT_ADDRESS;
    relayer = relayer
      ? ethers.utils.getAddress(relayer)
      : getDefaultRelayerAddress(destinationChainId, l1Token.symbol);

    const isMessageDefined = sdk.utils.isDefined(message);
    if (isMessageDefined) {
      if (!sdk.utils.isDefined(amountInput)) {
        throw new MissingParamError({
          message:
            "Parameter 'amount' must be defined when 'message' is defined",
          param: "amount",
        });
      }
      await validateDepositMessage(
        recipient,
        destinationChainId,
        relayer,
        outputToken.address,
        amountInput,
        message!
      );
    }
    const amount = BigNumber.from(
      amountInput ?? ethers.BigNumber.from("10").pow(l1Token.decimals)
    );
    let minDepositUsdForDestinationChainId = Number(
      process.env[`MIN_DEPOSIT_USD_${destinationChainId}`] ?? MIN_DEPOSIT_USD
    );
    if (isNaN(minDepositUsdForDestinationChainId)) {
      minDepositUsdForDestinationChainId = 0;
    }

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
    ];

    const depositArgs = {
      amount,
      inputToken: inputToken.address,
      outputToken: outputToken.address,
      recipientAddress: recipient,
      originChainId: computedOriginChainId,
      destinationChainId,
      message,
    };

    const [
      tokenPriceNative,
      _tokenPriceUsd,
      latestBlock,
      gasPrice,
      nativeGasCost,
    ] = await Promise.all([
      getCachedTokenPrice(
        l1Token.address,
        sdk.utils.getNativeTokenSymbol(destinationChainId).toLowerCase()
      ),
      getCachedTokenPrice(l1Token.address, "usd"),
      getCachedLatestBlock(HUB_POOL_CHAIN_ID),
      // If Linea, then we will defer gas price estimation to the SDK in getCachedFillGasUsage because
      // the priority fee depends upon the fill transaction calldata.
      destinationChainId === CHAIN_IDs.LINEA
        ? undefined
        : latestGasPriceCache(destinationChainId).get(),
      isMessageDefined
        ? undefined // Only use cached gas units if message is not defined, i.e. standard for standard bridges
        : getCachedNativeGasCost(depositArgs, { relayerAddress: relayer }),
    ]);
    const tokenPriceUsd = ethers.utils.parseUnits(_tokenPriceUsd.toString());

    const [
      opStackL1GasCost,
      multicallOutput,
      fullRelayerBalances,
      transferRestrictedBalances,
      fullRelayerMainnetBalances,
    ] = await Promise.all([
      nativeGasCost && sdk.utils.chainIsOPStack(destinationChainId)
        ? // Only use cached gas units if message is not defined, i.e. standard for standard bridges
          getCachedOpStackL1DataFee(depositArgs, nativeGasCost, {
            relayerAddress: relayer,
          })
        : undefined,
      callViaMulticall3(provider, multiCalls, {
        blockTag: latestBlock.number,
      }),
      Promise.all(
        fullRelayers.map((relayer) =>
          getCachedTokenBalance(
            destinationChainId,
            relayer,
            outputToken.address
          )
        )
      ),
      Promise.all(
        transferRestrictedRelayers.map((relayer) =>
          getCachedTokenBalance(
            destinationChainId,
            relayer,
            outputToken.address
          )
        )
      ),
      Promise.all(
        fullRelayers.map((relayer) =>
          destinationChainId === HUB_POOL_CHAIN_ID
            ? ethers.BigNumber.from("0")
            : getCachedTokenBalance(HUB_POOL_CHAIN_ID, relayer, l1Token.address)
        )
      ),
    ]);
    // This call should not make any additional RPC queries since we are passing in gasPrice, nativeGasCost
    // and tokenGasCost.
    const tokenGasCost =
      nativeGasCost && gasPrice
        ? nativeGasCost.mul(gasPrice).add(opStackL1GasCost ?? bnZero)
        : undefined;
    const relayerFeeDetails = await getRelayerFeeDetails(
      depositArgs,
      tokenPriceNative,
      relayer,
      gasPrice,
      nativeGasCost,
      tokenGasCost
    );
    logger.debug({
      at: "Limits",
      message: "Relayer fee details from SDK",
      relayerFeeDetails,
    });

    let { liquidReserves } = multicallOutput[1];
    const [liteChainIdsEncoded] = multicallOutput[2];
    const liteChainIds: number[] =
      liteChainIdsEncoded === "" ? [] : JSON.parse(liteChainIdsEncoded);
    const originChainIsLiteChain = liteChainIds.includes(computedOriginChainId);
    const destinationChainIsLiteChain =
      liteChainIds.includes(destinationChainId);
    const routeInvolvesLiteChain =
      originChainIsLiteChain || destinationChainIsLiteChain;

    const transferBalances = fullRelayerBalances.map((balance, i) =>
      balance.add(fullRelayerMainnetBalances[i])
    );

    let minDeposit = ethers.BigNumber.from(relayerFeeDetails.minDeposit);

    // Normalise the environment-set USD minimum to units of the token being bridged.
    let minDepositFloor = tokenPriceUsd.lte(0)
      ? ethers.BigNumber.from(0)
      : ethers.utils
          .parseUnits(
            minDepositUsdForDestinationChainId.toString(),
            l1Token.decimals
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

    if (!routeInvolvesLiteChain) {
      const lpCushion = ethers.utils.parseUnits(
        getLpCushion(l1Token.symbol, computedOriginChainId, destinationChainId),
        l1Token.decimals
      );
      liquidReserves = liquidReserves.sub(lpCushion);
      if (liquidReserves.lt(0)) liquidReserves = ethers.BigNumber.from(0);

      maxDepositInstant = minBN(maxDepositInstant, liquidReserves);
      maxDepositShortDelay = minBN(maxDepositShortDelay, liquidReserves);
    }

    // Apply chain max values when defined
    const includeDefaultMaxValues = originChainIsLiteChain;
    const includeRelayerBalances = originChainIsLiteChain;
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
      const relayers = includeRelayerBalances
        ? [...fullRelayers, ...transferRestrictedRelayers]
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
    const resolvedChainInputTokenMaxDeposit = bnOrMax(
      chainInputTokenMaxDeposit
    );

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

    // FIXME: Remove after campaign is complete
    const maximumDeposit =
      destinationChainId === CHAIN_IDs.ZK_SYNC &&
      computedOriginChainId === CHAIN_IDs.MAINNET
        ? liquidReserves
        : getMaxDeposit(
            liquidReserves,
            bufferedMaxDepositShortDelay,
            limitsBufferMultiplier,
            chainHasMaxBoundary,
            routeInvolvesLiteChain
          );

    const responseJson = {
      // Absolute minimum may be overridden by the environment.
      minDeposit: minBN(
        maximumDeposit,
        maxBN(minDeposit, minDepositFloor)
      ).toString(),
      maxDeposit: maximumDeposit.toString(),
      maxDepositInstant: bufferedMaxDepositInstant.toString(),
      maxDepositShortDelay: bufferedMaxDepositShortDelay.toString(),
      recommendedDepositInstant: bufferedRecommendedDepositInstant.toString(),
      relayerFeeDetails: {
        relayFeeTotal: relayerFeeDetails.relayFeeTotal,
        relayFeePercent: relayerFeeDetails.relayFeePercent,
        gasFeeTotal: relayerFeeDetails.gasFeeTotal,
        gasFeePercent: relayerFeeDetails.gasFeePercent,
        capitalFeeTotal: relayerFeeDetails.capitalFeeTotal,
        capitalFeePercent: relayerFeeDetails.capitalFeePercent,
      },
    };
    logger.debug({
      at: "Limits",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 1 second of cache time with
    // 59s to keep serving the stale data while recomputing the cached value.
    sendResponse(response, responseJson, 200, 1, 59);
  } catch (error: unknown) {
    return handleErrorCondition("limits", response, logger, error);
  }
};

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

export default handler;
