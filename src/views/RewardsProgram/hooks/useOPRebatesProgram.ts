import { useConnection, useRewardSummary } from "hooks";
import { GenericRewardInformationRowType } from "../GenericRewardsProgram/GenericInformationCard";
import { formatUnits, getToken } from "utils";
import { useMemo } from "react";
import { BigNumber } from "ethers";

export function useOPRebatesProgram() {
  const { account } = useConnection();
  const { summary } = useRewardSummary("op-rebates", account);
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
      },
    ],
    [summary, token]
  );

  return {
    labels,
    rewardsAmount: BigNumber.from(0),
    claimableAmount: BigNumber.from(summary.unclaimedRewards || 0),
  };
}
