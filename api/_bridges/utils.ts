import { BigNumber, ethers } from "ethers";
import { LimitsResponse } from "../_types";
import * as sdk from "@across-protocol/sdk";
import { getCachedLimits, ConvertDecimals } from "../_utils";
import { CHAIN_IDs } from "../_constants";
import {
  BridgeStrategyData,
  BridgeStrategyDataParams,
} from "../_bridges/types";

const ACROSS_THRESHOLD = 10_000; // 10K USD
const LARGE_DEPOSIT_THRESHOLD = 1_000_000; // 1M USD

export function isFullyUtilized(limits: LimitsResponse): boolean {
  // Check if utilization is high (>80%)
  const { liquidReserves, utilizedReserves } = limits.reserves;
  const _liquidReserves = BigNumber.from(liquidReserves);
  const _utilizedReserves = BigNumber.from(utilizedReserves);
  const flooredUtilizedReserves = _utilizedReserves.gt(0)
    ? _utilizedReserves
    : BigNumber.from(0);

  const utilizationThreshold = sdk.utils.fixedPointAdjustment.mul(80).div(100); // 80%

  // Calculate current utilization percentage
  const currentUtilization = flooredUtilizedReserves
    .mul(sdk.utils.fixedPointAdjustment)
    .div(_liquidReserves.add(flooredUtilizedReserves));

  return currentUtilization.gt(utilizationThreshold);
}

/**
 * Fetches bridge limits and utilization data in parallel to determine strategy requirements
 */
export async function getBridgeStrategyData({
  inputToken,
  outputToken,
  amount,
  amountType,
  recipient,
  depositor,
  logger,
}: BridgeStrategyDataParams): Promise<BridgeStrategyData> {
  try {
    const limits = await getCachedLimits(
      inputToken.address,
      outputToken.address,
      inputToken.chainId,
      outputToken.chainId,
      recipient || depositor
    );

    // Convert amount to input token decimals if it's in output token decimals
    let amountInInputTokenDecimals = amount;
    if (amountType === "exactOutput" || amountType === "minOutput") {
      amountInInputTokenDecimals = ConvertDecimals(
        outputToken.decimals,
        inputToken.decimals
      )(amount);
    }

    // Check if we can fill instantly
    const maxDepositInstant = BigNumber.from(limits.maxDepositInstant);
    const canFillInstantly = amountInInputTokenDecimals.lte(maxDepositInstant);

    // Check if bridge is fully utilized
    const isUtilizationHigh = isFullyUtilized(limits);

    // Check if input and output tokens are both USDC
    const isUsdcToUsdc =
      inputToken.symbol === "USDC" && outputToken.symbol === "USDC";

    // Check if deposit is > 1M USD or within Across threshold
    const depositAmountUsd = parseFloat(
      ethers.utils.formatUnits(amountInInputTokenDecimals, inputToken.decimals)
    );
    const isInThreshold = depositAmountUsd <= ACROSS_THRESHOLD;
    const isLargeDeposit = depositAmountUsd > LARGE_DEPOSIT_THRESHOLD;

    // Check if eligible for Fast CCTP (Polygon, BSC, Solana) and deposit > 10K USD
    const fastCctpChains = [CHAIN_IDs.POLYGON, CHAIN_IDs.BSC, CHAIN_IDs.SOLANA];
    const isFastCctpChain = fastCctpChains.includes(inputToken.chainId);
    const isFastCctpEligible =
      isFastCctpChain && depositAmountUsd > ACROSS_THRESHOLD;

    // Check if Linea is the source chain
    const isLineaSource = inputToken.chainId === CHAIN_IDs.LINEA;

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
    if (logger) {
      logger.warn({
        at: "getBridgeStrategyData",
        message: "Failed to fetch bridge strategy data, using defaults",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Safely return undefined if we can't fetch bridge strategy data
    return undefined;
  }
}
