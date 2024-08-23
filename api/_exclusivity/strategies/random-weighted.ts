import { randomBytes } from "crypto";
import config from "../../../src/data/exclusive-relayer-weights.json";
import { CandidateRelayer } from "../types";

export function randomWeighted(relayers: string[]): string {
  const random = randomBytes(relayers.length);
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
  return relayers.map((address) => {
    const { fixedWeight, dynamicWeight } = config[
      address as keyof typeof config
    ] ?? { fixedWeight: 1.0, dynamicWeight: 0.1 };
    return { address, fixedWeight, dynamicWeight };
  });
}
