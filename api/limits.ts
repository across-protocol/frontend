import * as sdk from "@across-protocol/sdk";
import { VercelResponse } from "@vercel/node";
import { BigNumber, ethers } from "ethers";
import { DEFAULT_SIMULATED_RECIPIENT_ADDRESS } from "./_constants";
import { TokenInfo, TypedVercelRequest } from "./_types";
import { object, assert, Infer, optional } from "superstruct";

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
  getCachedGasPrice,
} from "./_utils";

const LimitsQueryParamsSchema = object({
  token: optional(validAddress()),
  inputToken: optional(validAddress()),
  outputToken: optional(validAddress()),
  destinationChainId: positiveIntStr(),
  originChainId: optional(positiveIntStr()),
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
      REACT_APP_MIN_DEPOSIT_USD,
    } = process.env;
    const provider = getProvider(HUB_POOL_CHAIN_ID);

    const minDeposits = REACT_APP_MIN_DEPOSIT_USD
      ? JSON.parse(REACT_APP_MIN_DEPOSIT_USD)
      : {};

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

    const [tokenPriceNative, _tokenPriceUsd, latestBlock, gasPrice] =
      await Promise.all([
        getCachedTokenPrice(
          l1Token.address,
          sdk.utils.getNativeTokenSymbol(destinationChainId).toLowerCase()
        ),
        getCachedTokenPrice(l1Token.address, "usd"),
        getCachedLatestBlock(HUB_POOL_CHAIN_ID, 12),
        getCachedGasPrice(destinationChainId, 10),
      ]);
    const tokenPriceUsd = ethers.utils.parseUnits(_tokenPriceUsd.toString());

    const [
      relayerFeeDetails,
      multicallOutput,
      fullRelayerBalances,
      transferRestrictedBalances,
      fullRelayerMainnetBalances,
    ] = await Promise.all([
      getRelayerFeeDetails(
        inputToken.address,
        outputToken.address,
        ethers.BigNumber.from("10").pow(l1Token.decimals),
        computedOriginChainId,
        destinationChainId,
        DEFAULT_SIMULATED_RECIPIENT_ADDRESS,
        tokenPriceNative,
        undefined,
        getDefaultRelayerAddress(destinationChainId, l1Token.symbol),
        gasPrice
      ),
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
            (minDeposits[destinationChainId] ?? 0).toString(),
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

    const responseJson = {
      // Absolute minimum may be overridden by the environment.
      minDeposit: maxBN(minDeposit, minDepositFloor).toString(),
      maxDeposit: getMaxDeposit(
        liquidReserves,
        bufferedMaxDepositShortDelay,
        limitsBufferMultiplier,
        chainHasMaxBoundary,
        routeInvolvesLiteChain
      ).toString(),
      maxDepositInstant: bufferedMaxDepositInstant.toString(),
      maxDepositShortDelay: bufferedMaxDepositShortDelay.toString(),
      recommendedDepositInstant: bufferedRecommendedDepositInstant.toString(),
    };
    logger.debug({
      at: "Limits",
      message: "Response data",
      responseJson,
    });
    // Respond with a 200 status code and 15 seconds of cache with
    // 45 seconds of stale-while-revalidate.
    sendResponse(response, responseJson, 200, 15, 45);
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
