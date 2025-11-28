import { utils } from "ethers";
import { isDefined } from "utils/sdk";
import { SwapApprovalQuote } from "utils/serverless-api/prod/swap-approval";
import { formatUSDString, roundToDecimalPlaces } from "utils/format";

export function formatFeeUsd(value: string): string {
  const numValue = Number(value);

  if (numValue > 0 && numValue < 0.01) {
    const rounded = roundToDecimalPlaces(
      numValue,
      3,
      numValue < 0.001 ? "up" : "down" // we round "up" for very small values (< $0.001) so they aren't represented as 0
    );
    return `$${rounded}`;
  }

  return formatUSDString(value);
}

export function getSwapQuoteFees(swapQuote?: SwapApprovalQuote) {
  const rawValues = {
    totalFeeUsd: swapQuote?.fees?.total.amountUsd || "0",
    bridgeFeesUsd: swapQuote?.fees?.total.details.bridge.amountUsd || "0",
    appFeesUsd: swapQuote?.fees?.total.details.app.amountUsd || "0",
    swapImpactUsd: swapQuote?.fees?.total.details.swapImpact.amountUsd || "0",
  };

  return {
    totalFeeUsd: rawValues.totalFeeUsd,
    bridgeFeesUsd: rawValues.bridgeFeesUsd,
    appFeesUsd: rawValues.appFeesUsd,
    swapImpactUsd: rawValues.swapImpactUsd,
    totalFeeFormatted: formatFeeUsd(rawValues.totalFeeUsd),
    bridgeFeeFormatted: formatFeeUsd(rawValues.bridgeFeesUsd),
    appFeeFormatted: formatFeeUsd(rawValues.appFeesUsd),
    swapImpactFormatted: formatFeeUsd(rawValues.swapImpactUsd),
  };
}

const TEN_PERCENT_SCALED = utils.parseEther("0.1"); // 10%

export type PriceImpact = {
  tooHigh: boolean;
  priceImpact: number;
  priceImpactFormatted: string;
};

export function getPriceImpact(quote?: SwapApprovalQuote): PriceImpact {
  if (
    !isDefined(quote?.fees?.total?.pct) ||
    (isDefined(quote?.fees?.total?.pct) && quote.fees.total.pct.lt(0))
  ) {
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
