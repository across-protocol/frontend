import { utils } from "@across-protocol/sdk-v2";
import { BigNumber } from "ethers";
import { useConnection } from "hooks";
import { useReferralSummary } from "hooks/useReferralSummary";
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

  const { account } = useConnection();
  const { summary: referralSummary } = useReferralSummary(account);

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd");
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion("ACX", "usd");

  const depositReferralReward = useMemo(() => {
    if (!utils.isDefined(referralSummary) || !utils.isDefined(bridgeFee)) {
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
    const feePct = parseUnits(referralSummary.referralRate.toString(), 18);
    return totalFeesACX.mul(feePct).div(fixedPointAdjustment);
  }, [
    referralSummary,
    bridgeFee,
    convertL1ToBaseCurrency,
    convertRewardToBaseCurrency,
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
  const formatUsd = formatUnitsFnBuilder(18);
  const hasDepositReferralReward =
    depositReferralReward && depositReferralReward.gt(0);

  return {
    isDetailedFeesAvailable,
    setIsDetailedFeesAvailable,
    referralRewardAsBaseCurrency,
    gasFeeAsBaseCurrency,
    bridgeFeeAsBaseCurrency,
    netFeeAsBaseCurrency,
    formatUsd,
    depositReferralReward,
    hasDepositReferralReward,
  };
}
