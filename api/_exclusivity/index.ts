import ethers from "ethers";
import * as sdk from "@across-protocol/sdk";
import { getExclusivityPeriod, getRelayerConfig, getStrategy } from "./config";
import { ExclusiveRelayer } from "./types";

type BigNumber = ethers.BigNumber;

const { ZERO_ADDRESS } = sdk.constants;

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
  relayerFeePct: BigNumber
): Promise<ExclusiveRelayer> {
  const relayers = await getEligibleRelayers(
    originChainId,
    destinationChainId,
    outputToken,
    outputAmount,
    relayerFeePct
  );
  const exclusiveRelayer = getStrategy()(relayers);

  const exclusivityPeriod =
    exclusiveRelayer === ZERO_ADDRESS
      ? 0
      : getExclusivityPeriod(originChainId, destinationChainId);

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
  _destinationChainId: number,
  _outputToken: string,
  outputAmount: BigNumber,
  relayerFeePct: BigNumber
): Promise<string[]> {
  // Source all relayers that have opted in for this destination chain.
  const relayers = getRelayerConfig(originChainId);

  // @todo: Query gas token + outputToken balances.
  const relayerAddresses = relayers.map(({ address }) => address);
  const balances = relayerAddresses.map(() => ethers.BigNumber.from(1));

  const candidateRelayers = Object.entries(relayers)
    .filter(([, config], idx) => {
      const balance = balances[idx];
      if (balance.mul(config.balanceMultiplier).lte(outputAmount)) {
        return false;
      }

      if (relayerFeePct.lt(config.minProfitThreshold)) {
        return false;
      }

      return true;
    })
    .map(([relayer]) => relayer);

  // Filter relayers by:
  // - those whose configured minimum exclusivity is within the configured maximum permitted exclusivity.

  return candidateRelayers;
}
