import { useQuery } from "react-query";
import { BigNumber } from "ethers";

import { useConnection } from "hooks";
import { fetchIsClaimed, fetchReferralProofs } from "utils/merkle-distributor";

export function useUnclaimedReferralProofs() {
  const { isConnected, account } = useConnection();

  return useQuery(
    ["referral-rewards", "unclaimed", account],
    () => fetchUnclaimedReferralProofs(account),
    {
      enabled: isConnected && !!account,
    }
  );
}

async function fetchUnclaimedReferralProofs(account?: string) {
  const allProofs = await fetchReferralProofs(account);
  const isClaimedResults = await fetchIsClaimedForIndices(allProofs);

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
  indices: { accountIndex: number; windowIndex: number }[]
) {
  const isClaimedResults = await Promise.all(
    indices.map(async ({ accountIndex, windowIndex }) => {
      const isClaimed = await fetchIsClaimed(windowIndex, accountIndex);
      return {
        isClaimed,
        windowIndex,
        accountIndex,
      };
    })
  );

  return isClaimedResults;
}
