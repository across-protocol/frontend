import { useQuery } from "@tanstack/react-query";
import { BigNumber } from "ethers";

import { useConnection } from "hooks";
import {
  fetchIsClaimed,
  fetchAirdropProofs,
  fetchNextCreatedIndex,
} from "utils/merkle-distributor";
import {
  getUnclaimedProofsQueryKey,
  rewardProgramTypes,
  mapAsync,
} from "utils";

export function useUnclaimedProofs(rewardsType: rewardProgramTypes) {
  const { isConnected, account } = useConnection();

  return useQuery({
    queryKey: getUnclaimedProofsQueryKey(rewardsType, account),
    queryFn: () => fetchUnclaimedProofs(rewardsType, account),
    enabled: isConnected && !!account,
  });
}

export function useUnclaimedOpRewardsProofs() {
  const { isConnected, account } = useConnection();

  return useQuery({
    queryKey: getUnclaimedProofsQueryKey("op-rebates", account),
    queryFn: () => fetchUnclaimedProofs("op-rebates", account),
    enabled: isConnected && !!account,
  });
}

export function useUnclaimedArbRewardsProofs() {
  const { isConnected, account } = useConnection();

  return useQuery({
    queryKey: getUnclaimedProofsQueryKey("arb-rebates", account),
    queryFn: () => fetchUnclaimedProofs("arb-rebates", account),
    enabled: isConnected && !!account,
  });
}

async function fetchUnclaimedProofs(
  rewardsType: rewardProgramTypes,
  account?: string
) {
  const allProofs = await fetchAirdropProofs(rewardsType, account);
  const nextCreatedIndex = await fetchNextCreatedIndex(rewardsType);
  const publishedProofs = allProofs.filter(
    (proof) => proof.windowIndex < nextCreatedIndex.toNumber()
  );
  const isClaimedResults = await fetchIsClaimedForIndices(
    publishedProofs,
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
  const isClaimedResults = await mapAsync(
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
