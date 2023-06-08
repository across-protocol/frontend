export function getReceiveTokenSymbol(
  destinationChainId: number,
  bridgeTokenSymbol: string,
  isReceiverContract: boolean
) {
  const isDestinationChainPolygon = destinationChainId === 137;

  if (
    bridgeTokenSymbol === "ETH" &&
    (isDestinationChainPolygon || isReceiverContract)
  ) {
    return "WETH";
  }

  if (bridgeTokenSymbol === "WETH" && !isReceiverContract) {
    return "ETH";
  }

  return bridgeTokenSymbol;
}
