import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { getCachedTokenBalances } from "../_utils";
import { getExclusivityPeriod, getRelayerConfig, getStrategy } from "./config";
import { ExclusiveRelayer } from "./types";
import { getCachedRelayerFillLimit } from "./cache";

type BigNumber = ethers.BigNumber;
const { parseUnits } = ethers.utils;
const { ZERO_ADDRESS } = sdk.constants;
const { fixedPointAdjustment: fixedPoint } = sdk.utils;

// @todo: The minimum native token balance should probably be configurable.
const MIN_NATIVE_BALANCE = parseUnits("0.001");

/**
 * Select a specific relayer exclusivity strategy to apply.
 * This currently hardcodes the "none" strategy, but will be updated to support additional strategies
 * and selection from on env-based configuration.
 * @param originChainId Origin chain for deposit.
 * @param destinationChainId Destination chain for fill.
 * @param outputToken Input token to be referenced in fill.
 * @param outputToken Output token to be used in fill.
 * @param outputAmount Output amount to be used in fill.
 * @param outputAmountUsd Output amount in USD.
 * @param relayerFeePct Estimated relayer fee, assuming destination chain repayment.
 * @param estimatedFillTimeSec Estimated time to fill the transfer.
 */
export async function selectExclusiveRelayer(
  originChainId: number,
  destinationChainId: number,
  inputToken: {
    address: string;
    symbol: string;
  },
  outputToken: {
    address: string;
    symbol: string;
  },
  outputAmount: BigNumber,
  outputAmountUsd: BigNumber,
  relayerFeePct: BigNumber,
  estimatedFillTimeSec: number
): Promise<ExclusiveRelayer> {
  let exclusiveRelayer = ZERO_ADDRESS;
  let exclusivityPeriod = 0;

  const { name, selectorFn } = getStrategy(
    outputToken.symbol,
    destinationChainId
  );

  if (name === "none") {
    return { exclusiveRelayer, exclusivityPeriod };
  }

  const exclusivityPeriodSec = getExclusivityPeriod(estimatedFillTimeSec);
  const relayers = await getEligibleRelayers(
    originChainId,
    destinationChainId,
    inputToken.address,
    outputToken.address,
    outputAmount,
    outputAmountUsd,
    relayerFeePct,
    exclusivityPeriodSec
  );

  if (relayers.length > 0) {
    exclusiveRelayer = selectorFn(relayers);
    exclusivityPeriod =
      exclusiveRelayer === ZERO_ADDRESS ? 0 : exclusivityPeriodSec;
  }

  return { exclusiveRelayer, exclusivityPeriod };
}

/**
 * Select a specific relayer exclusivity strategy to apply.
 * This currently hardcodes the "none" strategy, but will be updated to support additional strategies
 * and selection from on env-based configuration.
 * @param originChainId Origin chain for deposit.
 * @param destinationChainId Destination chain for fill.
 * @param inputToken Input token to be referenced
 * @param outputToken Output token to be used in fill.
 * @param outputAmount Output amount to be used in fill.
 * @param outputAmountUsd Output amount in USD.
 * @param relayerFeePct Estimated relayer fee, assuming destination chain repayment.
 * @param exclusivityPeriodSec Exclusivity period for the transfer.
 */
async function getEligibleRelayers(
  originChainId: number,
  destinationChainId: number,
  inputToken: string,
  outputToken: string,
  outputAmount: BigNumber,
  outputAmountUsd: BigNumber,
  relayerFeePct: BigNumber,
  exclusivityPeriodSec: number
): Promise<string[]> {
  // Source all relayers that have opted in for this destination chain.
  const relayers = getRelayerConfig(originChainId);

  if (relayers.length === 0) {
    return [];
  }

  // @todo: Balances are returned as strings; consider mapping them automagically to BNs.
  const [{ balances }, fillConfigurations] = await Promise.all([
    getCachedTokenBalances(
      destinationChainId,
      relayers.map(({ address }) => address),
      [ZERO_ADDRESS, outputToken]
    ),
    Promise.all(
      relayers.map(({ address }) =>
        getCachedRelayerFillLimit(
          address,
          originChainId,
          destinationChainId,
          inputToken,
          outputToken
        )
      )
    ),
  ]);

  const candidates = relayers.map(({ address: relayer, ...config }, idx) => {
    const balance = balances[relayer]; // Balances of outputToken + nativeToken.
    // Resolve the specific configuration for our given range
    const relevantConfiguration = fillConfigurations[idx]?.find(
      ({ maxOutputAmount, minOutputAmount }) =>
        outputAmount.gte(minOutputAmount) && outputAmount.lte(maxOutputAmount)
    );
    // @todo: The balance multiplier must be scaled to n decimals to avoid underflow. Precompute it?
    const effectiveBalance = ethers.BigNumber.from(balance[outputToken])
      .mul(
        parseUnits(
          String(
            // Check the custom configuration then fall back to the github multiplier
            relevantConfiguration?.balanceMultiplier ?? config.balanceMultiplier
          )
        )
      )
      .div(fixedPoint);
    const effectiveExclusivityPeriod =
      relevantConfiguration?.minExclusivityPeriod
        ? Number(relevantConfiguration.minExclusivityPeriod)
        : config.minExclusivityPeriod;

    if (exclusivityPeriodSec < effectiveExclusivityPeriod) {
      return undefined;
    }
    if (effectiveBalance.lte(outputAmount)) {
      return undefined;
    }
    if (
      relayerFeePct.lt(
        parseUnits(
          String(
            relevantConfiguration?.minProfitThreshold ??
              config.minProfitThreshold
          )
        )
      )
    ) {
      return undefined;
    }
    if (ethers.BigNumber.from(balance[ZERO_ADDRESS]).lt(MIN_NATIVE_BALANCE)) {
      return undefined;
    }
    // No custom configuration set within defined buckets, fall back to the hardcoded configs
    if (relevantConfiguration === undefined) {
      if (
        outputAmountUsd.gt(ethers.utils.parseEther(String(config.maxFillSize)))
      ) {
        return undefined;
      }
    }
    // A valid custom configuration bucket is found and all above checks have been made
    return relayer;
  });
  return candidates.filter((v) => v !== undefined);
}
