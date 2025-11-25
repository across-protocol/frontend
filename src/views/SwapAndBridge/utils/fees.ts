import { utils } from "ethers";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";

export function getSwapQuoteFees(swapQuote?: SwapApprovalQuote) {
  return {
    totalFeeUsd: swapQuote?.fees?.total.amountUsd || "0",
    bridgeFeesUsd: swapQuote?.fees?.total.details.bridge.amountUsd || "0",
    appFeesUsd: swapQuote?.fees?.total.details.app.amountUsd || "0",
    swapImpactUsd: swapQuote?.fees?.total.details.swapImpact.amountUsd || "0",
  };
}

const TEN_PERCENT_SCALED = utils.parseEther("0.1"); // 10%

export function feesTooHigh(quote?: SwapApprovalQuote): boolean {
  if (!quote?.fees?.total?.pct) {
    return false;
  }

  const totalFeesPct = quote.fees.total.pct;
  return totalFeesPct.gte(TEN_PERCENT_SCALED);
}
