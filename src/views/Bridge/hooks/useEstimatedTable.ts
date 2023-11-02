import { utils } from "@across-protocol/sdk-v2";
import { BigNumber } from "ethers";
import { useReferralSummary } from "hooks/useReferralSummary";
import useReferrer from "hooks/useReferrer";
import { useTokenConversion } from "hooks/useTokenConversion";
import { useMemo, useState } from "react";
import {
  TokenInfo,
  fixedPointAdjustment,
  formatUnitsFnBuilder,
  parseUnits,
} from "utils";

export function useEstimatedTable(
  token: TokenInfo,
  gasFee?: BigNumber,
  bridgeFee?: BigNumber
) {
  const [isDetailedFeesAvailable, setIsDetailedFeesAvailable] = useState(false);

  const { referrer } = useReferrer();
  const { summary: referralSummary } = useReferralSummary(referrer);

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd");
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion("ACX", "usd");

  const depositReferralReward = useMemo(() => {
    if (
      !utils.isDefined(referralSummary) ||
      !utils.isDefined(bridgeFee) ||
      !referrer
    ) {
      return undefined;
    }
    const totalFeesUSD = convertL1ToBaseCurrency(bridgeFee);
    const acxExchangeRate = convertRewardToBaseCurrency(parseUnits("1", 18));
    if (!utils.isDefined(totalFeesUSD) || !utils.isDefined(acxExchangeRate)) {
      return undefined;
    }
    const totalFeesACX = totalFeesUSD
      .mul(fixedPointAdjustment)
      .div(acxExchangeRate);
    // 75% of the reward goes to the referree of the referral rate
    const availableRewardPercentage = referralSummary.referralRate * 0.75;
    return {
      tokens: totalFeesACX
        .mul(parseUnits(availableRewardPercentage.toString(), 18))
        .div(fixedPointAdjustment),
      percentage: availableRewardPercentage,
    };
  }, [
    referralSummary,
    bridgeFee,
    convertL1ToBaseCurrency,
    convertRewardToBaseCurrency,
    referrer,
  ]);

  const referralRewardAsBaseCurrency = convertRewardToBaseCurrency(
    depositReferralReward?.tokens
  );
  const gasFeeAsBaseCurrency = convertL1ToBaseCurrency(gasFee);
  const bridgeFeeAsBaseCurrency = convertL1ToBaseCurrency(bridgeFee);
  const netFeeAsBaseCurrency =
    gasFeeAsBaseCurrency && bridgeFeeAsBaseCurrency
      ? gasFeeAsBaseCurrency.add(bridgeFeeAsBaseCurrency)
      : undefined;
  const formatUsd = formatUnitsFnBuilder(18);
  const hasDepositReferralReward =
    depositReferralReward && depositReferralReward?.tokens.gt(0);

  return {
    isDetailedFeesAvailable,
    setIsDetailedFeesAvailable,
    referralRewardAsBaseCurrency,
    gasFeeAsBaseCurrency,
    bridgeFeeAsBaseCurrency,
    netFeeAsBaseCurrency,
    formatUsd,
    depositReferralReward: depositReferralReward?.tokens,
    depositReferralPercentage: depositReferralReward?.percentage,
    hasDepositReferralReward,
  };
}
