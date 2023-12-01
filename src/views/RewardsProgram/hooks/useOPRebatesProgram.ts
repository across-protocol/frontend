import { useConnection, useRewardSummary } from "hooks";
import { GenericRewardInformationRowType } from "../GenericRewardsProgram/GenericInformationCard";
import {
  capitalizeFirstLetter,
  formatUnits,
  getToken,
  rewardPrograms,
} from "utils";
import { useMemo } from "react";
import { BigNumber } from "ethers";

export function useOPRebatesProgram() {
  const { account } = useConnection();
  const { summary } = useRewardSummary("op-rebates", account);
  const { programName } = rewardPrograms["op-rebates"];
  const token = useMemo(() => getToken("OP"), []);

  if (summary.program !== "op-rebates") {
    throw new Error("Invalid program type");
  }

  const labels: GenericRewardInformationRowType[] = useMemo(
    () => [
      {
        title: "Volume to Optimism",
        tooltip: "Volume sent to Optimism",
        prefix: `${summary.depositsCount} transfer${
          summary.depositsCount === 1 ? "" : "s"
        }`,
        value: `$${summary.volumeUsd}`,
      },
      {
        title: "Rewards",
        tooltip: "Rewards earned from this Optimism program",
        value: `${formatUnits(summary.claimableRewards, token.decimals)} ${
          token.symbol
        }`,
        prefix: `${formatUnits(
          summary.unclaimedRewards ?? "0",
          token.decimals
        )} ${token.symbol} claimable`,
        prefixIcon: "clock",
        prefixIconTooltip: {
          content: `New ${programName.toLowerCase()} rewards are claimable 2 weeks after the first day of every month`,
          title: `${capitalizeFirstLetter(programName.toLowerCase())} claiming`,
        },
      },
    ],
    [programName, summary, token]
  );

  return {
    labels,
    rewardsAmount: BigNumber.from(summary.unclaimedRewards || 0),
    claimableAmount: BigNumber.from(summary.claimableRewards || 0),
  };
}
