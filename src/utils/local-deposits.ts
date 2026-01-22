import { SwapApprovalQuote } from "./serverless-api/prod/swap-approval";

export type FromBridgeAndSwapPagePayload = {
  timeSigned: number;
  swapQuote: SwapApprovalQuote;
  referrer: string | null;
  tradeType: "exactInput" | "exactOutput" | "minOutput";
  sender: string;
  recipient: string;
};

export function createFromBridgeAndSwapPagePayload(
  swapQuote: SwapApprovalQuote,
  referrer: string | null,
  tradeType: "exactInput" | "exactOutput" | "minOutput",
  sender: string,
  recipient: string
): FromBridgeAndSwapPagePayload {
  return {
    swapQuote,
    timeSigned: Date.now(),
    referrer,
    tradeType,
    sender,
    recipient,
  };
}
