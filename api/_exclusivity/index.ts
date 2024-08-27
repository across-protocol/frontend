import { ethers } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { getCachedTokenBalances } from "../_utils";
import { getExclusivityPeriod, getRelayerConfig, getStrategy } from "./config";
import { ExclusiveRelayer } from "./types";

type BigNumber = ethers.BigNumber;
const { parseUnits } = ethers.utils;
const { ZERO_ADDRESS } = sdk.constants;
const { fixedPointAdjustment: fixedPoint } = sdk.utils;

export function getExclusivityDeadline(
  exclusivityPeriod: number,
  exclusiveRelayer: string,
  depositMethod: string
) {
  const useExclusiveRelayer =
    exclusivityPeriod > 0 && exclusiveRelayer !== ZERO_ADDRESS;

  if (!useExclusiveRelayer) {
    return 0;
  }

  // NOTE: Currently, our SpokePool contracts either require a relative deadline (i.e. period) or
  // an absolute deadline (i.e. timestamp) depending on the deposit method that will be called.
  return depositMethod === "depositExclusive"
    ? exclusivityPeriod
    : sdk.utils.getCurrentTime() + exclusivityPeriod;
}

/**
 * Select a specific relayer exclusivity strategy to apply.
 * This currently hardcodes the "none" strategy, but will be updated to support additional strategies
 * and selection from on env-based configuration.
 * @param originChainId Origin chain for deposit.
 * @param destinationChainId Destination chain for fill.
 * @param outputToken Output token to be used in fill.
 * @param outputAmount Output amount to be used in fill.
 * @param outputAmountUsd Output amount in USD.
 * @param relayerFeePct Estimated relayer fee, assuming destination chain repayment.
 * @param estimatedFillTimeSec Estimated time to fill the transfer.
 */
export async function selectExclusiveRelayer(
  originChainId: number,
  destinationChainId: number,
  outputToken: string,
  outputAmount: BigNumber,
  outputAmountUsd: BigNumber,
  relayerFeePct: BigNumber,
  estimatedFillTimeSec: number
): Promise<ExclusiveRelayer> {
  let exclusiveRelayer = ZERO_ADDRESS;
  let exclusivityPeriod = 0;

  const { name, selectorFn } = getStrategy();

  if (name === "none") {
    return { exclusiveRelayer, exclusivityPeriod };
  }

  // @todo: remove this when all other SpokePools are redeployed to support `depositExclusive`.
  if (![690, 1135, 81457, 534352].includes(originChainId)) {
    return { exclusiveRelayer, exclusivityPeriod };
  }

  const exclusivityPeriodSec = getExclusivityPeriod(estimatedFillTimeSec);
  const relayers = await getEligibleRelayers(
    originChainId,
    destinationChainId,
    outputToken,
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
 * @param outputToken Output token to be used in fill.
 * @param outputAmount Output amount to be used in fill.
 * @param outputAmountUsd Output amount in USD.
 * @param relayerFeePct Estimated relayer fee, assuming destination chain repayment.
 * @param exclusivityPeriodSec Exclusivity period for the transfer.
 */
async function getEligibleRelayers(
  originChainId: number,
  destinationChainId: number,
  outputToken: string,
  outputAmount: BigNumber,
  outputAmountUsd: BigNumber,
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

      if (
        outputAmountUsd.gt(ethers.utils.parseEther(String(config.maxFillSize)))
      ) {
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

  return candidateRelayers;
}
