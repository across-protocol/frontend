/**
 * Returns the token symbol to be used for the receive token. The protocol bridges
 * ETH/WETH depending on certain conditions:
 * - If the user wants to bridge ETH and destination chain is Polygon, the bridge will send WETH
 * - If the user wants to bridge ETH and the receiver is a contract, the bridge will send WETH
 * - If the user wants to bridge WETH and the receiver is an EOA, the bridge will send ETH
 * @param destinationChainId Destination chain id.
 * @param bridgeTokenSymbol Token symbol to be bridged.
 * @param isReceiverContract Whether the receiver is a contract or not.
 * @returns The token symbol to be used for the receive token.
 */
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

export function isFromArbitrumUSDC(tokenSymbol: string, fromChainId: number) {
  return fromChainId === 42161 && tokenSymbol === "USDC";
}

export function isFromArbitrumNativeUSDC(
  tokenSymbol: string,
  fromChainId: number,
  displayTokenSymbol?: string
) {
  return (
    isFromArbitrumUSDC(tokenSymbol, fromChainId) &&
    displayTokenSymbol !== "USDC.e"
  );
}
