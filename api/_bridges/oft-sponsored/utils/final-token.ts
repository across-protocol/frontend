import { SPONSORED_OFT_FINAL_TOKEN_PER_OUTPUT_TOKEN } from "./constants";

export function getSponsoredOftFinalTokenAddress(
  outputTokenSymbol: string,
  intermediaryChainId: number
) {
  const finalToken =
    SPONSORED_OFT_FINAL_TOKEN_PER_OUTPUT_TOKEN[outputTokenSymbol];
  if (!finalToken) {
    throw new Error(
      `Sponsored OFT 'finalToken' not found for output token ${outputTokenSymbol}`
    );
  }
  const finalTokenAddress = finalToken.addresses[intermediaryChainId];
  if (!finalTokenAddress) {
    throw new Error(
      `Sponsored OFT 'finalTokenAddress' not found for ${finalToken.symbol} on chain ${intermediaryChainId}`
    );
  }
  return finalTokenAddress;
}
