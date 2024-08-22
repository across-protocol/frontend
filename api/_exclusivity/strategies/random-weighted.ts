import { CandidateRelayer } from "../types";

export function randomWeighted(relayers: string[]): string {
  const random = crypto.getRandomValues(new Uint8Array(relayers.length));

  const relayerWeights = getStrategyConfig(relayers).map((relayer, idx) => {
    const { dynamicWeight, fixedWeight, address } = relayer;
    const effectiveWeight = (dynamicWeight + fixedWeight) * random[idx];
    return { relayer: address, effectiveWeight };
  });

  // Select the relayer with the highest effective weight.
  const { relayer: exclusiveRelayer } = relayerWeights
    .slice(1)
    .reduce(
      (acc, relayer) =>
        relayer.effectiveWeight > acc.effectiveWeight ? relayer : acc,
      relayerWeights[0]
    );

  return exclusiveRelayer;
}

function getStrategyConfig(relayers: string[]): CandidateRelayer[] {
  // @todo: Import strategy-specific configuration.
  return relayers.map((address) => ({
    address,
    fixedWeight: 1.0,
    dynamicWeight: 1.0,
  }));
}
