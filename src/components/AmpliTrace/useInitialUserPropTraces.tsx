import { useState, useEffect } from "react";

import { useConnection, useWalletBalanceTrace } from "hooks";
import {
  identifyUserWallet,
  setUserId,
  identifyWalletChainId,
} from "utils/amplitude";
import { ampli } from "ampli";

export function useInitialUserPropTraces(isAmpliLoaded: boolean) {
  const [areInitialUserPropsSet, setAreInitialUserPropsSet] = useState(false);

  const { didAttemptAutoSelect, wallet, account, chainId } = useConnection();
  const walletBalanceTraceQuery = useWalletBalanceTrace();

  useEffect(() => {
    (async () => {
      // Ensures that we only set the initial user props once
      if (!isAmpliLoaded || !didAttemptAutoSelect || areInitialUserPropsSet) {
        return;
      }

      // Ensures that balances are loaded before setting the initial user props
      if (account && walletBalanceTraceQuery.status === "loading") {
        return;
      }

      if (wallet && account && chainId) {
        setUserId(account);

        await Promise.all([
          identifyUserWallet(wallet)?.promise,
          identifyWalletChainId(chainId).promise,
        ]);
      }

      ampli.applicationLoaded();

      setAreInitialUserPropsSet(true);
    })();
  }, [
    isAmpliLoaded,
    didAttemptAutoSelect,
    areInitialUserPropsSet,
    account,
    chainId,
    wallet,
    walletBalanceTraceQuery.status,
    walletBalanceTraceQuery.failureCount,
  ]);

  return { areInitialUserPropsSet };
}
