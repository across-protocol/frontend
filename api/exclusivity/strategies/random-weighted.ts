// @todo: relayers should be of type RelayerConfig.
export function randomWeighted(relayers: string[]): string {
  const random = crypto.getRandomValues(new Uint8Array(relayers.length));

  const relayerWeights = relayers.map((relayer, idx) => {
    const dynamicWeight = 1.0;
    const fixedWeight = 1.0;
    const effectiveWeight = (dynamicWeight + fixedWeight) * random[idx];
    return { address: relayer, effectiveWeight };
  });

  // Select the relayer with the highest effective weight.
  const { address: exclusiveRelayer } = relayerWeights
    .slice(1)
    .reduce(
      (acc, relayer) =>
        relayer.effectiveWeight > acc.effectiveWeight ? relayer : acc,
      relayerWeights[0]
    );

  return exclusiveRelayer;
}
