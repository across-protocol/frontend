import { useQuery } from "react-query";
import { BigNumber } from "ethers";
import { utils } from "@across-protocol/sdk";

import { useConnection } from "hooks";
import { fetchIsClaimed, fetchAirdropProofs } from "utils/merkle-distributor";
import { getUnclaimedProofsQueryKey, rewardProgramTypes } from "utils";

export function useUnclaimedProofs(rewardsType: rewardProgramTypes) {
  const { isConnected, account } = useConnection();

  return useQuery(
    getUnclaimedProofsQueryKey(rewardsType, account),
    () => fetchUnclaimedProofs(rewardsType, account),
    {
      enabled: isConnected && !!account,
    }
  );
}

export function useUnclaimedReferralProofs() {
  const { isConnected, account } = useConnection();

  return useQuery(
    getUnclaimedProofsQueryKey("referrals", account),
    () => fetchUnclaimedProofs("referrals", account),
    {
      enabled: isConnected && !!account,
    }
  );
}

export function useUnclaimedOpRewardsProofs() {
  const { isConnected, account } = useConnection();

  return useQuery(
    getUnclaimedProofsQueryKey("op-rebates", account),
    () => fetchUnclaimedProofs("op-rebates", account),
    {
      enabled: isConnected && !!account,
    }
  );
}

export function useUnclaimedArbRewardsProofs() {
  const { isConnected, account } = useConnection();

  return useQuery(
    getUnclaimedProofsQueryKey("arb-rebates", account),
    () => fetchUnclaimedProofs("arb-rebates", account),
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
  const isClaimedResults = await utils.mapAsync(
    indices,
    async ({ accountIndex, windowIndex }) => {
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
    }
  );

  return isClaimedResults;
}
