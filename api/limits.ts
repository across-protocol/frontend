import * as sdk from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import { BigNumber, ethers } from "ethers";

import { CHAIN_IDs, CUSTOM_GAS_TOKENS } from "./_constants";
import { TokenInfo, TypedVercelRequest } from "./_types";
import { assert, Infer, optional, string, type } from "superstruct";

import {
  ENABLED_ROUTES,
  HUB_POOL_CHAIN_ID,
  callViaMulticall3,
  ConvertDecimals,
  getCachedTokenPrice,
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
  validAddress,
  validateChainAndTokenParams,
  getCachedLatestBlock,
  parsableBigNumberString,
  latestGasPriceCache,
  getCachedNativeGasCost,
  getCachedOpStackL1DataFee,
  getLimitCap,
  boolStr,
} from "./_utils";
import { MissingParamError } from "./_errors";
import { getEnvs } from "./_env";
import {
  getDefaultRelayerAddress,
  getFullRelayers,
  getTransferRestrictedRelayers,
} from "./_relayer-address";
import { getDefaultRecipientAddress } from "./_recipient-address";
import { calcGasFeeDetails } from "./_gas";
import { sendResponse } from "./_response_utils";
import { getCachedTokenBalance } from "./_balance";
import { validateDepositMessage } from "./_message";
import { tracer } from "../instrumentation";

const LimitsQueryParamsSchema = type({
  token: optional(validAddress()),
  inputToken: optional(validAddress()),
  outputToken: optional(validAddress()),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
  amount: optional(parsableBigNumberString()),
  message: optional(string()),
  recipient: optional(validAddress()),
  relayer: optional(validAddress()),
  allowUnmatchedDecimals: optional(boolStr()),
});

const LimitsBodySchema = type({
  message: optional(string()),
});

type LimitsQueryParams = Infer<typeof LimitsQueryParamsSchema>;
type LimitsBody = Infer<typeof LimitsBodySchema>;

const handler = async (
  { query, body }: TypedVercelRequest<LimitsQueryParams, LimitsBody>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Limits",
    message: "Query data",
    query,
  });
  return tracer.startActiveSpan("limits", async (span) => {
    try {
      const {
        MIN_DEPOSIT_USD, // The global minimum deposit in USD for all destination chains. The minimum deposit
        // returned by the relayerFeeDetails() call will be floor'd with this value (after converting to token units).
      } = getEnvs();
      const provider = getProvider(HUB_POOL_CHAIN_ID);

      assert(query, LimitsQueryParamsSchema);

      if (body) {
        assert(body, LimitsBodySchema);
      }

      const {
        destinationChainId,
        resolvedOriginChainId: computedOriginChainId,
        l1Token,
        inputToken,
        outputToken,
      } = validateChainAndTokenParams(query);

      const fullRelayersL1 = getFullRelayers();
      const fullRelayersDestinationChain = getFullRelayers(destinationChainId);
      const transferRestrictedRelayersDestinationChain =
        getTransferRestrictedRelayers(destinationChainId, l1Token.symbol);

      // Optional parameters that caller can use to specify specific deposit details with which
      // to compute limits.
      let {
        amount: _amount,
        recipient: _recipient,
        relayer: _relayer,
        message: _messageFromQuery,
      } = query;
      const { message: _messageFromBody } = body ?? {};

      const message = _messageFromQuery || _messageFromBody;

      // Very small amount to simulate a fill of the deposit that should always be available in the relayer's balance.
      const simulationAmount = ethers.BigNumber.from("100");
      const recipient = sdk.utils.toAddressType(
        _recipient || getDefaultRecipientAddress(destinationChainId),
        destinationChainId
      );
      const relayer = sdk.utils.toAddressType(
        _relayer ||
          getDefaultRelayerAddress(destinationChainId, l1Token.symbol),
        destinationChainId
      );

      // If the amount is not provided, we use the simulation amount throughout.
      const amount = BigNumber.from(_amount ?? simulationAmount);

      const isMessageDefined = sdk.utils.isDefined(message);
      if (isMessageDefined) {
        if (!sdk.utils.isDefined(_amount)) {
          throw new MissingParamError({
            message:
              "Parameter 'amount' must be defined when 'message' is defined",
            param: "amount",
          });
        }
        await validateDepositMessage({
          recipient: recipient.toBytes32(),
          destinationChainId,
          relayer: relayer.toBytes32(),
          outputTokenAddress: outputToken.address,
          amountInput: ConvertDecimals(
            inputToken.decimals,
            outputToken.decimals
          )(amount),
          message: message!,
        });
      }

      let minDepositUsdForDestinationChainId = Number(
        getEnvs()[`MIN_DEPOSIT_USD_${destinationChainId}`] ?? MIN_DEPOSIT_USD
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

      // These simulation args are only used when the message is not defined.
      const simulationDepositArgs = {
        // For the purposes of estimating gas costs, we always use the small simulation amount.
        amount: simulationAmount,
        inputToken: sdk.utils
          .toAddressType(inputToken.address, computedOriginChainId)
          .toBytes32(),
        outputToken: sdk.utils
          .toAddressType(outputToken.address, destinationChainId)
          .toBytes32(),
        recipientAddress: recipient.toBytes32(),
        originChainId: computedOriginChainId,
        destinationChainId,
        message,
        relayerAddress: relayer.toBytes32(),
      };
      // We only want to derive an unsigned fill txn from the deposit args if the
      // destination chain is Linea or Solana:
      // - Linea: Priority fee depends on the destination chain call data
      // - Solana: Compute units estimation fails for missing values
      const shouldUseUnsignedFillForGasPriceCache =
        destinationChainId === CHAIN_IDs.LINEA ||
        sdk.utils.chainIsSvm(destinationChainId);

      const [
        tokenPriceNative,
        _tokenPriceUsd,
        latestBlock,
        gasPriceEstimate,
        nativeGasCost,
      ] = await Promise.all([
        getCachedTokenPrice({
          l1Token: l1Token.address,
          baseCurrency:
            CUSTOM_GAS_TOKENS[destinationChainId]?.toLowerCase() ??
            sdk.utils.getNativeTokenSymbol(destinationChainId).toLowerCase(),
        }),
        getCachedTokenPrice({
          l1Token: l1Token.address,
          baseCurrency: "usd",
        }),
        getCachedLatestBlock(HUB_POOL_CHAIN_ID),
        latestGasPriceCache(
          destinationChainId,
          shouldUseUnsignedFillForGasPriceCache
            ? simulationDepositArgs
            : undefined,
          {
            relayerAddress: relayer.toBytes32(),
          }
        ).get(),
        isMessageDefined || sdk.utils.chainIsSvm(destinationChainId)
          ? undefined // Only use cached gas units if message is not defined and the destination is EVM, i.e. standard for standard bridges
          : getCachedNativeGasCost(simulationDepositArgs, {
              relayerAddress: relayer.toBytes32(),
            }).get(),
      ]);
      const tokenPriceUsd = ethers.utils.parseUnits(_tokenPriceUsd.toString());

      const [
        opStackL1GasCost,
        multicallOutput,
        _fullRelayerBalances,
        _transferRestrictedBalances,
        _fullRelayerMainnetBalances,
      ] = await Promise.all([
        nativeGasCost && sdk.utils.chainIsOPStack(destinationChainId)
          ? // Only use cached gas units if message is not defined, i.e. standard for standard bridges
            getCachedOpStackL1DataFee(simulationDepositArgs, nativeGasCost, {
              relayerAddress: relayer.toBytes32(),
            }).get()
          : undefined,
        callViaMulticall3(provider, multiCalls, {
          blockTag: latestBlock.number,
        }),
        Promise.all(
          fullRelayersDestinationChain.map((relayer) =>
            getCachedTokenBalance(
              destinationChainId,
              relayer,
              outputToken.address
            )
          )
        ),
        Promise.all(
          transferRestrictedRelayersDestinationChain.map((relayer) =>
            getCachedTokenBalance(
              destinationChainId,
              relayer,
              outputToken.address
            )
          )
        ),
        Promise.all(
          fullRelayersL1.map((relayer) =>
            destinationChainId === HUB_POOL_CHAIN_ID
              ? ethers.BigNumber.from("0")
              : getCachedTokenBalance(
                  HUB_POOL_CHAIN_ID,
                  relayer,
                  l1Token.address
                )
          )
        ),
      ]);
      // Calculate gas fee details based on cached values
      const gasFeeDetails =
        nativeGasCost && gasPriceEstimate
          ? calcGasFeeDetails({
              gasPriceEstimate,
              nativeGasCost,
              opStackL1GasCost,
            })
          : undefined;
      const tokenGasCost = gasFeeDetails?.tokenGasCost;
      const gasPrice = gasFeeDetails?.gasPrice;

      // This call should not make any additional RPC queries since we are passing in gasPrice, nativeGasCost
      // and tokenGasCost.
      const relayerFeeDetails = await getRelayerFeeDetails(
        // We need to pass in the true amount here so the returned percentages are correct.
        { ...simulationDepositArgs, amount: amount },
        tokenPriceNative,
        relayer.toBytes32(),
        gasPrice,
        nativeGasCost,
        tokenGasCost
      );
      logger.debug({
        at: "Limits",
        message: "Relayer fee details from SDK",
        relayerFeeDetails,
      });

      const { liquidReserves: _liquidReserves } = multicallOutput[1];
      const [liteChainIdsEncoded] = multicallOutput[2];
      const [poolRebalanceRouteOrigin] = multicallOutput[3];
      const [poolRebalanceRouteDestination] = multicallOutput[4];

      const liteChainIds: number[] =
        liteChainIdsEncoded === "" ? [] : JSON.parse(liteChainIdsEncoded);
      const originChainIsLiteChain = liteChainIds.includes(
        computedOriginChainId
      );
      const destinationChainIsLiteChain =
        liteChainIds.includes(destinationChainId);
      const routeInvolvesLiteChain =
        originChainIsLiteChain || destinationChainIsLiteChain;

      const originChainIsUltraLightChain =
        poolRebalanceRouteOrigin === ethers.constants.AddressZero;
      const destinationChainIsUltraLightChain =
        poolRebalanceRouteDestination === ethers.constants.AddressZero;
      const routeInvolvesUltraLightChain =
        originChainIsUltraLightChain || destinationChainIsUltraLightChain;

      // Base every amount on the input token decimals.
      let liquidReserves = ConvertDecimals(
        l1Token.decimals,
        inputToken.decimals
      )(_liquidReserves);
      const fullRelayerBalances = _fullRelayerBalances.map((balance) =>
        ConvertDecimals(outputToken.decimals, inputToken.decimals)(balance)
      );
      const fullRelayerMainnetBalances = _fullRelayerMainnetBalances.map(
        (balance) =>
          ConvertDecimals(l1Token.decimals, inputToken.decimals)(balance)
      );
      const transferRestrictedBalances = _transferRestrictedBalances.map(
        (balance) =>
          ConvertDecimals(outputToken.decimals, inputToken.decimals)(balance)
      );

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

      if (!routeInvolvesLiteChain && !routeInvolvesUltraLightChain) {
        const _lpCushion = ethers.utils.parseUnits(
          getLpCushion(
            l1Token.symbol,
            computedOriginChainId,
            destinationChainId
          ),
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
        const fullRelayersOriginChain = getFullRelayers(computedOriginChainId);
        const transferRestrictedRelayersOriginChain =
          getTransferRestrictedRelayers(computedOriginChainId, l1Token.symbol);
        const relayers = includeRelayerBalances
          ? [
              ...fullRelayersOriginChain,
              ...transferRestrictedRelayersOriginChain,
            ]
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

      const bnOrMax = (value?: BigNumber) =>
        value ?? ethers.constants.MaxUint256;
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

      const limitCap = getLimitCap(
        inputToken.symbol,
        inputToken.decimals,
        destinationChainId
      );

      const responseJson = {
        // Absolute minimum may be overridden by the environment.
        minDeposit: minBN(
          maximumDeposit,
          limitCap,
          maxBN(minDeposit, minDepositFloor)
        ).toString(),
        maxDeposit: minBN(maximumDeposit, limitCap).toString(),
        maxDepositInstant: minBN(
          bufferedMaxDepositInstant,
          limitCap
        ).toString(),
        maxDepositShortDelay: minBN(
          bufferedMaxDepositShortDelay,
          limitCap
        ).toString(),
        recommendedDepositInstant: minBN(
          bufferedRecommendedDepositInstant,
          limitCap
        ).toString(),
        relayerFeeDetails: {
          relayFeeTotal: relayerFeeDetails.relayFeeTotal,
          relayFeePercent: relayerFeeDetails.relayFeePercent,
          gasFeeTotal: relayerFeeDetails.gasFeeTotal,
          gasFeePercent: relayerFeeDetails.gasFeePercent,
          capitalFeeTotal: relayerFeeDetails.capitalFeeTotal,
          capitalFeePercent: relayerFeeDetails.capitalFeePercent,
        },
        gasFeeDetails: gasFeeDetails
          ? {
              nativeGasCost: gasFeeDetails.nativeGasCost.toString(),
              opStackL1GasCost: gasFeeDetails.opStackL1GasCost?.toString(),
              gasPrice: gasFeeDetails.gasPrice.toString(),
              tokenGasCost: gasFeeDetails.tokenGasCost.toString(),
            }
          : undefined,
      };
      logger.debug({
        at: "Limits",
        message: "Response data",
        responseJson,
      });
      sendResponse({
        response,
        body: responseJson,
        statusCode: 200,
        cacheSeconds: 1,
        staleWhileRevalidateSeconds: 59,
      });
    } catch (error: unknown) {
      return handleErrorCondition("limits", response, logger, error, span);
    } finally {
      span.end();
    }
  });
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
  const tokenValueInWei = tokenPriceUsd.eq(sdk.utils.bnZero)
    ? sdk.utils.bnZero
    : usdValueInWei.mul(sdk.utils.fixedPointAdjustment).div(tokenPriceUsd);
  const tokenValue = ConvertDecimals(18, inputToken.decimals)(tokenValueInWei);
  return sdk.utils.toBN(tokenValue);
};

export default handler;
