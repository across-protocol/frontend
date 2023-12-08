import { utils } from "@across-protocol/sdk-v2";
import { BigNumber, utils as ethersUtils } from "ethers";
import { useRewardToken } from "hooks/useRewardToken";
import { useTokenConversion } from "hooks/useTokenConversion";
import { useMemo, useState } from "react";
import {
  TokenInfo,
  fixedPointAdjustment,
  formatUnits,
  isDefined,
  parseUnits,
} from "utils";

export function useEstimatedTable(
  token: TokenInfo,
  destinationChainId: number,
  gasFee?: BigNumber,
  bridgeFee?: BigNumber
) {
  const [isDetailedFeesAvailable, setIsDetailedFeesAvailable] = useState(false);
  const { rewardToken, isACXRewardToken, availableRewardPercentage } =
    useRewardToken(destinationChainId);
  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd");
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion(rewardToken.symbol, "usd");

  const depositReward = useMemo(() => {
    if (
      availableRewardPercentage === undefined ||
      bridgeFee === undefined ||
      gasFee === undefined
    ) {
      return undefined;
    }
    const totalFeeInL1 = bridgeFee.add(gasFee);
    const totalRewardInL1 = totalFeeInL1
      .mul(availableRewardPercentage)
      .div(fixedPointAdjustment);

    const totalFeesUSD = convertL1ToBaseCurrency(totalRewardInL1);
    const rewardExchangeRate = convertRewardToBaseCurrency(
      parseUnits("1", rewardToken.decimals) // Convert 1 token to USD
    );
    if (
      !utils.isDefined(totalFeesUSD) ||
      !utils.isDefined(rewardExchangeRate)
    ) {
      return undefined;
    }
    const totalRewardInRewardToken = totalFeesUSD
      .mul(parseUnits("1.0", rewardToken.decimals)) // Account for the fixed point adjustment
      .div(rewardExchangeRate);

    return {
      rewardAsL1: totalRewardInL1,
      rewardAsRewardToken: totalRewardInRewardToken,
    };
  }, [
    availableRewardPercentage,
    bridgeFee,
    convertL1ToBaseCurrency,
    convertRewardToBaseCurrency,
    gasFee,
    rewardToken.decimals,
  ]);

  const hasDepositReferralReward = depositReward?.rewardAsL1.gt(0) ?? false;

  const baseCurrencyConversions = useMemo(() => {
    const parseUsd = (usd?: number) =>
      isDefined(usd) ? parseUnits(String(usd), 18) : undefined;
    const formatNumericUsd = (usd: BigNumber) =>
      Number(Number(ethersUtils.formatUnits(usd, 18)).toFixed(2));
    const gasFeeInUSD = convertL1ToBaseCurrency(gasFee);
    const bridgeFeeInUSD = convertL1ToBaseCurrency(bridgeFee);

    if (!isDefined(gasFeeInUSD) || !isDefined(bridgeFeeInUSD)) {
      return {
        gasFeeAsBaseCurrency: undefined,
        bridgeFeeAsBaseCurrency: undefined,
        referralRewardAsBaseCurrency: undefined,
        netFeeAsBaseCurrency: undefined,
      };
    }

    const numericGasFee = formatNumericUsd(gasFeeInUSD);
    const numericBridgeFee = formatNumericUsd(bridgeFeeInUSD);
    const numericReward = availableRewardPercentage
      ? (numericBridgeFee + numericGasFee) *
        Number(formatUnits(availableRewardPercentage, 18))
      : undefined;

    const netFeeAsBaseCurrency =
      numericBridgeFee + numericGasFee - (numericReward ?? 0);

    return {
      gasFeeAsBaseCurrency: parseUsd(numericGasFee),
      bridgeFeeAsBaseCurrency: parseUsd(numericBridgeFee),
      referralRewardAsBaseCurrency: parseUsd(numericReward),
      netFeeAsBaseCurrency: parseUsd(netFeeAsBaseCurrency),
    };
  }, [availableRewardPercentage, bridgeFee, convertL1ToBaseCurrency, gasFee]);

  return {
    ...baseCurrencyConversions,
    isDetailedFeesAvailable,
    setIsDetailedFeesAvailable,
    depositReferralReward: depositReward?.rewardAsRewardToken,
    depositReferralPercentage: availableRewardPercentage,
    hasDepositReferralReward,
    rewardToken,
    isRewardAcx: isACXRewardToken,
  };
}
