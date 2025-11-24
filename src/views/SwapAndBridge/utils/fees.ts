import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";

export function getSwapQuoteFees(swapQuote?: SwapApprovalQuote) {
  return {
    totalFeeUsd: swapQuote?.fees?.total.amountUsd || "0",
    bridgeFeesUsd: swapQuote?.fees?.total.details.bridge.amountUsd || "0",
    appFeesUsd: swapQuote?.fees?.total.details.app.amountUsd || "0",
    swapImpactUsd: swapQuote?.fees?.total.details.swapImpact.amountUsd || "0",
  };
}
