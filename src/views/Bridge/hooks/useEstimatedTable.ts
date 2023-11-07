import { utils } from "@across-protocol/sdk-v2";
import { BigNumber } from "ethers";
import { useRewardToken } from "hooks/useRewardToken";
import { useTokenConversion } from "hooks/useTokenConversion";
import { useMemo, useState } from "react";
import { TokenInfo, fixedPointAdjustment, parseUnits } from "utils";

export function useEstimatedTable(
  token: TokenInfo,
  destinationChainId: number,
  gasFee?: BigNumber,
  bridgeFee?: BigNumber
) {
  const [isDetailedFeesAvailable, setIsDetailedFeesAvailable] = useState(false);

  const { rewardToken, availableRewardPercentage, isACXRewardToken } =
    useRewardToken(destinationChainId);

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd");
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion(rewardToken.symbol, "usd");

  const depositReferralReward: BigNumber | undefined = useMemo(() => {
    if (availableRewardPercentage === undefined) {
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

    return totalFeesInRewardCurrency
      .mul(parseUnits(availableRewardPercentage.toString(), 18))
      .div(fixedPointAdjustment);
  }, [
    bridgeFee,
    availableRewardPercentage,
    convertL1ToBaseCurrency,
    convertRewardToBaseCurrency,
    rewardToken.decimals,
  ]);

  const referralRewardAsBaseCurrency = convertRewardToBaseCurrency(
    depositReferralReward
  );
  const gasFeeAsBaseCurrency = convertL1ToBaseCurrency(gasFee);
  const bridgeFeeAsBaseCurrency = convertL1ToBaseCurrency(bridgeFee);
  const netFeeAsBaseCurrency =
    gasFeeAsBaseCurrency && bridgeFeeAsBaseCurrency
      ? gasFeeAsBaseCurrency.add(bridgeFeeAsBaseCurrency)
      : undefined;
  const hasDepositReferralReward = depositReferralReward?.gt(0);

  return {
    isDetailedFeesAvailable,
    setIsDetailedFeesAvailable,
    referralRewardAsBaseCurrency,
    gasFeeAsBaseCurrency,
    bridgeFeeAsBaseCurrency,
    netFeeAsBaseCurrency,
    depositReferralReward: depositReferralReward,
    depositReferralPercentage: availableRewardPercentage,
    hasDepositReferralReward,
    rewardToken,
    isRewardAcx: isACXRewardToken,
  };
}
