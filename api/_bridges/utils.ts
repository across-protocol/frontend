import { BigNumber, ethers } from "ethers";
import { LimitsResponse } from "../_types";
import * as sdk from "@across-protocol/sdk";
import {
  getTokenByAddress,
  getCachedLimits,
  HUB_POOL_CHAIN_ID,
} from "../_utils";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../_constants";
import {
  BridgeStrategyData,
  BridgeStrategyDataParams,
} from "../_bridges/types";

export function isFullyUtilized(limits: LimitsResponse): boolean {
  // Check if utilization is high (>80%)
  const { liquidReserves, utilizedReserves } = limits.reserves;
  const _liquidReserves = BigNumber.from(liquidReserves);
  const _utilizedReserves = BigNumber.from(utilizedReserves);

  const utilizationThreshold = sdk.utils.fixedPointAdjustment.mul(80).div(100); // 80%

  // Calculate current utilization percentage
  const currentUtilization = _utilizedReserves
    .mul(sdk.utils.fixedPointAdjustment)
    .div(_liquidReserves.add(_utilizedReserves));

  return currentUtilization.gt(utilizationThreshold);
}

/**
 * Fetches bridge limits and utilization data in parallel to determine strategy requirements
 */
export async function getBridgeStrategyData({
  inputToken,
  outputToken,
  amount,
  recipient,
  depositor,
  logger,
}: BridgeStrategyDataParams): Promise<BridgeStrategyData> {
  logger.debug({
    at: "getBridgeStrategyData",
    message: "Starting bridge strategy data fetch",
    inputToken: inputToken.address,
    outputToken: outputToken.address,
    amount: amount.toString(),
  });

  try {
    // Get token details for symbol and decimals first
    const inputTokenDetails = getTokenByAddress(
      inputToken.address,
      inputToken.chainId
    );
    if (!inputTokenDetails) {
      throw new Error(
        `Input token not found for address ${inputToken.address}`
      );
    }

    // Get L1 token address using TOKEN_SYMBOLS_MAP logic
    const l1TokenAddress =
      TOKEN_SYMBOLS_MAP[
        inputTokenDetails.symbol as keyof typeof TOKEN_SYMBOLS_MAP
      ]?.addresses[HUB_POOL_CHAIN_ID];
    if (!l1TokenAddress) {
      throw new Error(
        `L1 token not found for symbol ${inputTokenDetails.symbol}`
      );
    }

    const l1Token = getTokenByAddress(l1TokenAddress, HUB_POOL_CHAIN_ID);
    if (!l1Token) {
      throw new Error(
        `L1 token details not found for address ${l1TokenAddress}`
      );
    }

    const inputUnit = BigNumber.from(10).pow(inputTokenDetails.decimals);
    const limits =
      // Get bridge limits
      await getCachedLimits(
        inputToken.address,
        outputToken.address,
        inputToken.chainId,
        outputToken.chainId,
        inputUnit.toString(),
        recipient || depositor
      );

    // Check if we can fill instantly
    const maxDepositInstant = BigNumber.from(limits.maxDepositInstant);
    const canFillInstantly = amount.lte(maxDepositInstant);

    const isUtilizationHigh = isFullyUtilized(limits);

    // Get output token details
    const outputTokenDetails = getTokenByAddress(
      outputToken.address,
      outputToken.chainId
    );

    // Check if input and output tokens are both USDC
    const isUsdcToUsdc =
      inputTokenDetails?.symbol === "USDC" &&
      outputTokenDetails?.symbol === "USDC";

    // Check if deposit is > 1M USD
    const depositAmountUsd = parseFloat(
      ethers.utils.formatUnits(amount, inputTokenDetails?.decimals || 18)
    );
    const isInThreshold = depositAmountUsd <= 10_000; // 10K USD
    const isLargeDeposit = depositAmountUsd > 1_000_000; // 1M USD

    // Check if eligible for Fast CCTP (Polygon, BSC, Solana) and deposit > 10K USD
    const fastCctpChains = [CHAIN_IDs.POLYGON, CHAIN_IDs.BSC, CHAIN_IDs.SOLANA];
    const isFastCctpChain =
      fastCctpChains.includes(inputToken.chainId) ||
      fastCctpChains.includes(outputToken.chainId);
    const isFastCctpEligible = isFastCctpChain && depositAmountUsd > 10_000; // 10K USD

    // Check if Linea is the source chain
    const isLineaSource = inputToken.chainId === CHAIN_IDs.LINEA;

    logger.debug({
      at: "getBridgeStrategyData",
      message: "Successfully completed bridge strategy data fetch",
      results: {
        canFillInstantly,
        isUtilizationHigh,
        isUsdcToUsdc,
        isLargeDeposit,
        isFastCctpEligible,
        isLineaSource,
      },
    });

    return {
      canFillInstantly,
      isUtilizationHigh,
      isUsdcToUsdc,
      isLargeDeposit,
      isInThreshold,
      isFastCctpEligible,
      isLineaSource,
    };
  } catch (error) {
    logger.warn({
      at: "getBridgeStrategyData",
      message: "Failed to fetch bridge strategy data, using defaults",
      error: error instanceof Error ? error.message : String(error),
    });

    // Safely return undefined if we can't fetch bridge strategy data
    return undefined;
  }
}
