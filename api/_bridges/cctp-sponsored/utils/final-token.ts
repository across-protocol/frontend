import { SPONSORED_CCTP_FINAL_TOKEN_PER_OUTPUT_TOKEN } from "./constants";

export function getSponsoredCctpFinalTokenAddress(
  outputTokenSymbol: string,
  intermediaryChainId: number
) {
  const finalToken =
    SPONSORED_CCTP_FINAL_TOKEN_PER_OUTPUT_TOKEN[outputTokenSymbol];
  if (!finalToken) {
    throw new Error(
      `'finalToken' not found for output token ${outputTokenSymbol}`
    );
  }
  const finalTokenAddress = finalToken.addresses[intermediaryChainId];
  if (!finalTokenAddress) {
    throw new Error(
      `'finalTokenAddress' not found for ${finalToken.symbol} on chain ${intermediaryChainId}`
    );
  }
  return finalTokenAddress;
}
