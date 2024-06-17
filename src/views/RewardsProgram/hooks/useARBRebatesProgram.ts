import { useConnection, useRewardSummary } from "hooks";
import { GenericRewardInformationRowType } from "../GenericRewardsProgram/GenericInformationCard";
import {
  capitalizeFirstLetter,
  formatUnitsWithMaxFractions,
  getToken,
  rewardPrograms,
} from "utils";
import { useMemo } from "react";
import { BigNumber } from "ethers";
import { useUnclaimedArbRewardsProofs } from "hooks/useUnclaimedProofs";

export function useARBRebatesProgram() {
  const { account } = useConnection();
  const { summary } = useRewardSummary("arb-rebates", account);
  const { programName, claimableTooltipBody } = rewardPrograms["arb-rebates"];
  const token = useMemo(() => getToken("ARB"), []);
  const { data: unclaimedArbRewardsData } = useUnclaimedArbRewardsProofs();

  if (summary.program !== "arb-rebates") {
    throw new Error("Invalid program type");
  }

  const labels: GenericRewardInformationRowType[] = useMemo(
    () => [
      {
        title: "Volume to Arbitrum",
        tooltip: "Volume sent to Arbitrum",
        prefix: `${summary.depositsCount} transfer${
          summary.depositsCount === 1 ? "" : "s"
        }`,
        value: `$${summary.volumeUsd}`,
      },
      {
        title: "Rewards",
        tooltip: "Rewards earned from this Arbitrum program",
        value: `${formatUnitsWithMaxFractions(
          summary.unclaimedRewards || 0,
          token.decimals
        )} ${token.symbol}`,
        prefix: `${formatUnitsWithMaxFractions(
          unclaimedArbRewardsData?.claimableAmount ?? 0,
          token.decimals
        )} ${token.symbol} claimable`,
        prefixIcon: "info",
        prefixIconTooltip: {
          content: claimableTooltipBody,
          title: `${capitalizeFirstLetter(programName.toLowerCase())} claiming`,
        },
      },
    ],
    [
      programName,
      summary,
      token,
      unclaimedArbRewardsData?.claimableAmount,
      claimableTooltipBody,
    ]
  );

  return {
    labels,
    rewardsAmount: BigNumber.from(summary.unclaimedRewards || 0),
    claimableAmount: BigNumber.from(
      unclaimedArbRewardsData?.claimableAmount || 0
    ),
  };
}
