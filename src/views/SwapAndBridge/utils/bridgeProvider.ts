import {
  SwapApprovalApiCallReturnType,
  SwapApprovalQuote,
} from "../../../utils/serverless-api/prod/swap-approval";

export type BridgeProvider =
  | "across"
  | "hypercore"
  | "cctp"
  | "oft"
  | "sponsored-intent"
  | "sponsored-cctp"
  | "sponsored-oft";

export function isBridgeProviderSponsored(
  bridgeProvider: BridgeProvider
): boolean {
  return (
    bridgeProvider === "sponsored-intent" ||
    bridgeProvider === "sponsored-cctp" ||
    bridgeProvider === "sponsored-oft"
  );
}

export const getProviderFromQuote = (
  swapQuote: SwapApprovalApiCallReturnType | undefined
): BridgeProvider => swapQuote?.steps.bridge.provider || "across";

export function isQuoteSponsored(quote?: SwapApprovalQuote): boolean {
  const provider = getProviderFromQuote(quote);
  return isBridgeProviderSponsored(provider);
}
