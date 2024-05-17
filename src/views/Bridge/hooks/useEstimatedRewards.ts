import { BigNumber, utils as ethersUtils } from "ethers";
import { useTokenConversion } from "hooks/useTokenConversion";
import { useMemo } from "react";
import {
  TokenInfo,
  fixedPointAdjustment,
  formatUnitsWithMaxFractions,
  getToken,
  isDefined,
  parseUnits,
  parseUnitsWithExtendedDecimals,
  rewardPrograms,
  chainIdToRewardsProgramName,
  rewardProgramTypes,
} from "utils";

export type EstimatedRewards = ReturnType<typeof useEstimatedRewards>;

export function useEstimatedRewards(
  token: TokenInfo,
  destinationChainId: number,
  isSwap: boolean,
  gasFee?: BigNumber,
  bridgeFee?: BigNumber,
  swapFee?: BigNumber
) {
  const rewardProgramName = chainIdToRewardsProgramName[destinationChainId];
  const rewardProgram = rewardProgramName
    ? rewardPrograms[
        chainIdToRewardsProgramName[destinationChainId] as rewardProgramTypes
      ]
    : undefined;
  const rewardToken = rewardProgram
    ? getToken(rewardProgram.rewardTokenSymbol)
    : undefined;
  const availableRewardPercentage = rewardProgram
    ? parseUnits(String(rewardProgram.highestPct), 18)
    : undefined;

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd");
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion(rewardToken?.symbol || token.symbol, "usd");

  const depositReward = useMemo(() => {
    if (
      availableRewardPercentage === undefined ||
      rewardToken === undefined ||
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
    if (!isDefined(totalFeesUSD) || !isDefined(rewardExchangeRate)) {
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
    rewardToken,
  ]);

  const hasDepositReward = depositReward?.rewardAsL1.gt(0) ?? false;

  const baseCurrencyConversions = useMemo(() => {
    const parseUsd = (usd?: number) =>
      isDefined(usd)
        ? parseUnitsWithExtendedDecimals(String(usd), 18)
        : undefined;
    const formatNumericUsd = (usd: BigNumber) =>
      Number(Number(ethersUtils.formatUnits(usd, 18)).toFixed(2));
    const gasFeeInUSD = convertL1ToBaseCurrency(gasFee);
    const bridgeFeeInUSD = convertL1ToBaseCurrency(bridgeFee);
    const swapFeeInUSD = convertL1ToBaseCurrency(swapFee);

    if (
      !isDefined(gasFeeInUSD) ||
      !isDefined(bridgeFeeInUSD) ||
      (isSwap && !isDefined(swapFeeInUSD))
    ) {
      return {
        gasFeeAsBaseCurrency: undefined,
        bridgeFeeAsBaseCurrency: undefined,
        referralRewardAsBaseCurrency: undefined,
        netFeeAsBaseCurrency: undefined,
        swapFeeAsBaseCurrency: undefined,
      };
    }

    const numericGasFee = formatNumericUsd(gasFeeInUSD);
    const numericBridgeFee = formatNumericUsd(bridgeFeeInUSD);
    const numericReward = availableRewardPercentage
      ? (numericBridgeFee + numericGasFee) *
        Number(formatUnitsWithMaxFractions(availableRewardPercentage, 18))
      : undefined;
    const numericSwapFee = swapFeeInUSD ? formatNumericUsd(swapFeeInUSD) : 0;

    const netFeeAsBaseCurrency =
      numericBridgeFee + numericGasFee + numericSwapFee - (numericReward ?? 0);

    return {
      gasFeeAsBaseCurrency: parseUsd(numericGasFee),
      bridgeFeeAsBaseCurrency: parseUsd(numericBridgeFee),
      referralRewardAsBaseCurrency: parseUsd(numericReward),
      netFeeAsBaseCurrency: parseUsd(netFeeAsBaseCurrency),
      swapFeeAsBaseCurrency: parseUsd(numericSwapFee),
    };
  }, [
    availableRewardPercentage,
    bridgeFee,
    convertL1ToBaseCurrency,
    gasFee,
    swapFee,
    isSwap,
  ]);

  return {
    ...baseCurrencyConversions,
    reward: depositReward?.rewardAsRewardToken,
    rewardPercentage: availableRewardPercentage,
    hasDepositReward,
    rewardToken,
  };
}
