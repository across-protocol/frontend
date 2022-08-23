import { useQuery } from "react-query";
import { utils } from "ethers";

import { useConnection } from "state/hooks";

export function useClaimableTokens() {
  const { isConnected, account } = useConnection();

  return useQuery(
    ["claimable", account],
    () => getClaimableTokens(account as string),
    {
      enabled: isConnected && !!account,
    }
  );
}

// TODO: use correct function
async function getClaimableTokens(account: string) {
  await new Promise((resolve) => setTimeout(() => resolve(true), 5_000));
  return {
    liquidityClaim: utils.parseEther("10.322"),
    bridgingClaim: utils.parseEther("22.012"),
    communityClaim: utils.parseEther("41.124"),
    totalClaim: utils.parseEther("73.458"),
  };
}
