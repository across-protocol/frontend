import { useQuery } from "react-query";

import { useConnection } from "state/hooks";

export function useIsEligible() {
  const { isConnected, account } = useConnection();

  return useQuery(
    ["isEligible", account],
    () => getIsAccountEligible(account as string),
    {
      enabled: isConnected && !!account,
    }
  );
}

// TODO: use correct function
async function getIsAccountEligible(account: string) {
  await new Promise((resolve) => setTimeout(() => resolve(true), 5_000));
  return true;
}
