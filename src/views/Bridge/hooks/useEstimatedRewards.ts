import { BigNumber, utils as ethersUtils } from "ethers";
import { useAvailableRemainingRewards } from "hooks/useAvailableRemainingRewards";
import { useTokenConversion } from "hooks/useTokenConversion";
import { DateTime } from "luxon";
import { useMemo } from "react";
import {
  TokenInfo,
  chainIdToRewardsProgramName,
  fixedPointAdjustment,
  formatUnitsWithMaxFractions,
  getToken,
  isDefined,
  min,
  parseUnits,
  parseUnitsWithExtendedDecimals,
  rewardProgramTypes,
  rewardPrograms,
  rewardProgramsAvailable,
} from "utils";

export type EstimatedRewards = ReturnType<typeof useEstimatedRewards>;

export function useEstimatedRewards(
  token: TokenInfo,
  destinationChainId: number,
  isSwap: boolean,
  inputAmount?: BigNumber,
  bridgeFee?: BigNumber,
  swapFee?: BigNumber
) {
  const rewardProgramName = chainIdToRewardsProgramName[destinationChainId];
  let rewardProgram = rewardProgramName
    ? rewardPrograms[
        chainIdToRewardsProgramName[destinationChainId] as rewardProgramTypes
      ]
    : undefined;

  if (!rewardProgramsAvailable.includes(rewardProgramName)) {
    rewardProgram = undefined;
  }

  const { areRewardTokensAvailable } =
    useAvailableRemainingRewards(rewardProgramName);

  const rewardToken =
    rewardProgram && areRewardTokensAvailable
      ? getToken(rewardProgram.rewardTokenSymbol)
      : undefined;
  const availableRewardPercentage =
    rewardProgram && areRewardTokensAvailable
      ? parseUnits(String(rewardProgram.highestPct), 18)
      : undefined;

  // Rewards are handled in the previous day so we need to convert the current UTC date to the previous day
  // As a note: if the current time is before 03:00 UTC, we need to actually go back two days because the
  //            previous days pricing is not available until 03:00 UTC
  const now = DateTime.now().toUTC();
  const historicalDate = now.minus({
    days: now.hour < 3 ? 2 : 1,
  });
  const historicalISODate = historicalDate.toISODate()?.toString();
  // we are grabbing the inverted ISO date because the conversion API expects the date in the format
  const yesterdaysDate = historicalISODate?.split("-").reverse().join("-");

  const { convertTokenToBaseCurrency: convertL1ToBaseCurrency } =
    useTokenConversion(token.symbol, "usd", yesterdaysDate);
  const { convertTokenToBaseCurrency: convertRewardToBaseCurrency } =
    useTokenConversion(
      rewardToken?.symbol || token.symbol,
      "usd",
      yesterdaysDate
    );

  const depositReward = useMemo(() => {
    if (
      availableRewardPercentage === undefined ||
      rewardToken === undefined ||
      bridgeFee === undefined ||
      inputAmount === undefined
    ) {
      return undefined;
    }
    const totalFeeInL1 = bridgeFee;
    const maximalFee = inputAmount
      .mul(parseUnits("0.0025", 18)) // Cap fee at 25 basis points of input amount
      .div(fixedPointAdjustment);

    const cappedFee = min(totalFeeInL1, maximalFee);

    const totalRewardInL1 = cappedFee
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
    rewardToken,
    inputAmount,
  ]);

  const hasDepositReward = depositReward?.rewardAsL1.gt(0) ?? false;

  const baseCurrencyConversions = useMemo(() => {
    const parseUsd = (usd?: number) =>
      isDefined(usd)
        ? parseUnitsWithExtendedDecimals(String(usd), 18)
        : undefined;
    const formatNumericUsd = (usd: BigNumber) =>
      Number(Number(ethersUtils.formatUnits(usd, 18)).toFixed(2));
    const bridgeFeeInUSD = convertL1ToBaseCurrency(bridgeFee);
    const swapFeeInUSD = convertL1ToBaseCurrency(swapFee);
    const inputAmountInUSD = convertL1ToBaseCurrency(inputAmount);

    if (
      !isDefined(bridgeFeeInUSD) ||
      !isDefined(inputAmountInUSD) ||
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

    const numericInputAmount = formatNumericUsd(inputAmountInUSD);
    const numericBridgeFee = formatNumericUsd(bridgeFeeInUSD);
    // Reward is calculated based on bridgeFee only (which includes gasFee)
    const numericReward = availableRewardPercentage
      ? Math.min(
          numericInputAmount * 0.0025, // Cap reward at 25 basis points
          numericBridgeFee
        ) * Number(formatUnitsWithMaxFractions(availableRewardPercentage, 18))
      : undefined;
    const numericSwapFee = swapFeeInUSD ? formatNumericUsd(swapFeeInUSD) : 0;

    // Net fee = bridgeFee + swapFee - reward
    const netFeeAsBaseCurrency =
      numericBridgeFee + numericSwapFee - (numericReward ?? 0);

    return {
      bridgeFeeAsBaseCurrency: parseUsd(numericBridgeFee),
      referralRewardAsBaseCurrency: parseUsd(numericReward),
      netFeeAsBaseCurrency: parseUsd(netFeeAsBaseCurrency),
      swapFeeAsBaseCurrency: parseUsd(numericSwapFee),
    };
  }, [
    availableRewardPercentage,
    bridgeFee,
    convertL1ToBaseCurrency,
    swapFee,
    isSwap,
    inputAmount,
  ]);

  return {
    ...baseCurrencyConversions,
    reward: depositReward?.rewardAsRewardToken,
    rewardPercentage: availableRewardPercentage,
    hasDepositReward,
    rewardToken,
    rewardProgram,
  };
}
