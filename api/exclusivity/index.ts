import ethers from "ethers";
import { getExclusivityPeriod, getStrategy } from "./config";
import { ExclusiveRelayer } from "./types";

type BigNumber = ethers.BigNumber;

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
export function selectExclusiveRelayer(
  originChainId: number,
  destinationChainId: number,
  outputToken: string,
  outputAmount: BigNumber,
  relayerFeePct: BigNumber
): ExclusiveRelayer {
  const strategy = getStrategy();

  const exclusivityPeriod = getExclusivityPeriod(
    originChainId,
    destinationChainId
  );

  const relayers = getEligibleRelayers(
    destinationChainId,
    outputToken,
    outputAmount,
    relayerFeePct
  );
  const exclusiveRelayer = strategy(relayers);
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
function getEligibleRelayers(
  _destintionChainId: number,
  _outputToken: string,
  _outputAmount: BigNumber,
  _relayerFeePct: BigNumber
): string[] {
  // Source all relayers that have opted in for this destination chain.

  // Filter relayers by:
  // - those whose gas token balance exceeds some base amount (i.e. enough to make a fill).
  // - those whose outputToken balance exceeds the min threshold (i.e. n * outputAmount).
  // - those whose configured minimum exclusivity is within the configured maximum permitted exclusivity.
  // - those whose configured minimum profitability is satisfied by the computed relayer fee.

  return [];
}
