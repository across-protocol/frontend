import { useQuery } from "react-query";
import { BigNumber } from "ethers";

import { useConnection } from "hooks";
import { fetchIsClaimed, fetchAirdropProofs } from "utils/merkle-distributor";
import { useMemo } from "react";
import { rewardProgramTypes } from "utils";

export function useUnclaimedProofs(rewardsType: rewardProgramTypes) {
  const { isConnected, account } = useConnection();
  const queryIdentifier = useMemo(() => {
    if (rewardsType === "referrals") {
      return ["referral-rewards", "unclaimed"];
    } else {
      return ["op-rewards", "unclaimed"];
    }
  }, [rewardsType]);

  return useQuery(
    [...queryIdentifier, account],
    () => fetchUnclaimedProofs(rewardsType, account),
    {
      enabled: isConnected && !!account,
    }
  );
}
export function useUnclaimedReferralProofs() {
  const { isConnected, account } = useConnection();

  return useQuery(
    ["referral-rewards", "unclaimed", account],
    () => fetchUnclaimedProofs("referrals", account),
    {
      enabled: isConnected && !!account,
    }
  );
}

export function useUnclaimedOpRewardsProofs() {
  const { isConnected, account } = useConnection();

  return useQuery(
    ["op-rewards", "unclaimed", account],
    () => fetchUnclaimedProofs("op-rebates", account),
    {
      enabled: isConnected && !!account,
    }
  );
}

async function fetchUnclaimedProofs(
  rewardsType: rewardProgramTypes,
  account?: string
) {
  const allProofs = await fetchAirdropProofs(rewardsType, account);
  const isClaimedResults = await fetchIsClaimedForIndices(
    allProofs,
    rewardsType
  );

  const unclaimed = allProofs.filter(
    (proof) =>
      isClaimedResults.findIndex(
        (isClaimedResult) =>
          !isClaimedResult.isClaimed &&
          proof.accountIndex === isClaimedResult.accountIndex &&
          proof.windowIndex === isClaimedResult.windowIndex
      ) >= 0
  );
  const claimableAmount = unclaimed.reduce(
    (sum, { amount }) => sum.add(amount),
    BigNumber.from(0)
  );
  return {
    claimableAmount,
    unclaimed,
  };
}

async function fetchIsClaimedForIndices(
  indices: { accountIndex: number; windowIndex: number }[],
  rewardsType: rewardProgramTypes
) {
  const isClaimedResults = await Promise.all(
    indices.map(async ({ accountIndex, windowIndex }) => {
      const isClaimed = await fetchIsClaimed(
        windowIndex,
        accountIndex,
        rewardsType
      );
      return {
        isClaimed,
        windowIndex,
        accountIndex,
      };
    })
  );

  return isClaimedResults;
}
