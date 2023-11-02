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
  getToken,
  parseUnits,
} from "utils";

export function useEstimatedTable(
  token: TokenInfo,
  destinationChainId: number,
  gasFee?: BigNumber,
  bridgeFee?: BigNumber
) {
  const [isDetailedFeesAvailable, setIsDetailedFeesAvailable] = useState(false);

  const rewardToken = useMemo(
    () => getToken(destinationChainId === 10 ? "OP" : "ACX"),
    [destinationChainId]
  );

  const { referrer } = useReferrer();
  const { summary: referralSummary } = useReferralSummary(referrer);

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd");
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion(rewardToken.symbol, "usd");

  const depositReferralReward = useMemo(() => {
    if (
      rewardToken.symbol === "ACX" &&
      (!utils.isDefined(referralSummary) ||
        !utils.isDefined(bridgeFee) ||
        !referrer)
    ) {
      return undefined;
    }
    const totalFeesUSD = convertL1ToBaseCurrency(bridgeFee);
    const rewardExchangeRate = convertRewardToBaseCurrency(
      parseUnits("1", rewardToken.decimals) // Convert 1 token to USD
    );
    if (
      !utils.isDefined(totalFeesUSD) ||
      !utils.isDefined(rewardExchangeRate)
    ) {
      return undefined;
    }
    const totalFeesInRewardCurrency = totalFeesUSD
      .mul(parseUnits("1.0", rewardToken.decimals)) // Account for the fixed point adjustment
      .div(rewardExchangeRate);

    // OP Destination chain has a 95% referral rate
    // ACX Destination chain has a 75% referee rate of the referrers referral rate
    const availableRewardPercentage =
      destinationChainId === 10 ? 0.95 : referralSummary.referralRate * 0.75;

    return {
      tokens: totalFeesInRewardCurrency
        .mul(parseUnits(availableRewardPercentage.toString(), 18))
        .div(fixedPointAdjustment),
      percentage: availableRewardPercentage,
    };
  }, [
    referralSummary,
    bridgeFee,
    referrer,
    convertL1ToBaseCurrency,
    convertRewardToBaseCurrency,
    rewardToken,
    destinationChainId,
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
    rewardToken,
    isRewardAcx: rewardToken.symbol === "ACX",
  };
}
