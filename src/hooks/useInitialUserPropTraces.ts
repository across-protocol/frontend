import { useState, useEffect } from "react";

import { useConnection, useWalletBalanceTrace } from "hooks";
import {
  identifyUserWallet,
  setUserId,
  identifyWalletChainId,
  identifyReferrer,
} from "utils/amplitude";
import { ampli } from "ampli";

export function useInitialUserPropTraces(isAmpliLoaded: boolean) {
  const [areInitialUserPropsSet, setAreInitialUserPropsSet] = useState(false);
  const [prevTrackedAccount, setPrevTrackedAccount] = useState<
    string | undefined
  >();
  const [didApplicationLoad, setDidApplicationLoad] = useState(false);

  const { connector, account, chainId } = useConnection();
  const walletBalanceTraceQuery = useWalletBalanceTrace();

  // Re-triggers the initial user props when the account changes
  useEffect(() => {
    if (prevTrackedAccount === account) {
      return;
    }

    setAreInitialUserPropsSet(false);
  }, [account, prevTrackedAccount]);

  useEffect(() => {
    (async () => {
      // Ensures that we only set the initial user props once
      if (!isAmpliLoaded || areInitialUserPropsSet) {
        return;
      }

      // Ensures that balances are loaded before setting the initial user props
      if (account && walletBalanceTraceQuery.status === "pending") {
        return;
      }

      if (connector && account && chainId) {
        setUserId(account);

        await Promise.all([
          identifyUserWallet(account, connector.name)?.promise,
          identifyWalletChainId(chainId).promise,
        ]);
      }

      // Always enforce referring_domain
      await identifyReferrer()?.promise;

      setAreInitialUserPropsSet(true);
      setPrevTrackedAccount(account);
    })();
  }, [
    isAmpliLoaded,
    areInitialUserPropsSet,
    account,
    prevTrackedAccount,
    chainId,
    connector,
    walletBalanceTraceQuery.status,
    walletBalanceTraceQuery.failureCount,
  ]);

  useEffect(() => {
    // Ensures that this event is triggered once per session
    if (!didApplicationLoad && areInitialUserPropsSet) {
      ampli.applicationLoaded();
      setDidApplicationLoad(true);
    }
  }, [didApplicationLoad, areInitialUserPropsSet]);

  return { areInitialUserPropsSet };
}
