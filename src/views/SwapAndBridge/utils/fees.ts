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

export type PriceImpact = {
  tooHigh: boolean;
  priceImpact: number;
  priceImpactFormatted: string;
};

export function getPriceImpact(quote?: SwapApprovalQuote): PriceImpact {
  if (!quote?.fees?.total?.pct) {
    return {
      tooHigh: false,
      priceImpact: 0,
      priceImpactFormatted: "0",
    };
  }

  const tooHigh = quote.fees.total.pct.gte(TEN_PERCENT_SCALED);
  const priceImpact = Number(utils.formatEther(quote.fees.total.pct));
  const priceImpactFormatted = (priceImpact * 100).toFixed(1);

  return {
    priceImpact,
    priceImpactFormatted,
    tooHigh,
  };
}
