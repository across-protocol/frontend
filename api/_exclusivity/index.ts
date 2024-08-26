import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { getCachedTokenBalances } from "../_utils";
import { getExclusivityPeriod, getRelayerConfig, getStrategy } from "./config";
import { ExclusiveRelayer } from "./types";

type BigNumber = ethers.BigNumber;
const { parseUnits } = ethers.utils;
const { ZERO_ADDRESS } = sdk.constants;
const { fixedPointAdjustment: fixedPoint } = sdk.utils;

/**
 * Select a specific relayer exclusivity strategy to apply.
 * This currently hardcodes the "none" strategy, but will be updated to support additional strategies
 * and selection from on env-based configuration.
 * @param originChainId Origin chain for deposit.
 * @param destinationChainId Destination chain for fill.
 * @param outputToken Output token to be used in fill.
 * @param outputamount Output amount to be used in fill.
 * @param relayerFeePct Estimated relayer fee, assuming destination chain repayment.
 */
export async function selectExclusiveRelayer(
  originChainId: number,
  destinationChainId: number,
  outputToken: string,
  outputAmount: BigNumber,
  relayerFeePct: BigNumber,
  estimatedFillTimeSec: number
): Promise<ExclusiveRelayer> {
  const exclusivityPeriodSec = getExclusivityPeriod(estimatedFillTimeSec);
  // @todo: Resolving the strategy _after_ the eligible relayers imposes an undesirable blocking call.
  const relayers = await getEligibleRelayers(
    originChainId,
    destinationChainId,
    outputToken,
    outputAmount,
    relayerFeePct,
    exclusivityPeriodSec
  );

  let exclusiveRelayer = ZERO_ADDRESS;
  let exclusivityPeriod = 0;

  if (relayers.length > 0) {
    exclusiveRelayer = getStrategy()(relayers);
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
 * @param outputToken Output token to be used in fill.
 * @param outputamount Output amount to be used in fill.
 * @param relayerFeePct Estimated relayer fee, assuming destination chain repayment.
 */
async function getEligibleRelayers(
  originChainId: number,
  destinationChainId: number,
  outputToken: string,
  outputAmount: BigNumber,
  relayerFeePct: BigNumber,
  exclusivityPeriodSec: number
): Promise<string[]> {
  // Source all relayers that have opted in for this destination chain.
  const relayers = getRelayerConfig(originChainId);

  // @todo: Balances are returned as strings; consider mapping them automagically to BNs.
  const { balances } = await getCachedTokenBalances(
    destinationChainId,
    relayers.map(({ address }) => address),
    [ZERO_ADDRESS, outputToken]
  );

  // @todo: The minimum native token balance should probably be configurable.
  const minNativeBalance = parseUnits("0.001");
  const candidateRelayers = relayers
    .filter(({ address: relayer, ...config }) => {
      const balance = balances[relayer]; // Balances of outputToken + nativeToken.

      // @todo: The balance multiplier must be scaled to n decimals to avoid underflow. Precompute it?
      const effectiveBalance = ethers.BigNumber.from(balance[outputToken])
        .mul(parseUnits(String(config.balanceMultiplier)))
        .div(fixedPoint);

      if (exclusivityPeriodSec < config.minExclusivityPeriod) {
        return false;
      }
      if (effectiveBalance.lte(outputAmount)) {
        return false;
      }

      if (relayerFeePct.lt(parseUnits(String(config.minProfitThreshold)))) {
        return false;
      }

      if (ethers.BigNumber.from(balance[ZERO_ADDRESS]).lt(minNativeBalance)) {
        return false;
      }

      return true;
    })
    .map(({ address }) => address);

  // Filter relayers by:
  // - those whose configured minimum exclusivity is within the configured maximum permitted exclusivity.

  return candidateRelayers;
}
