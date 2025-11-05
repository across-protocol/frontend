import { useEffect, useState } from "react";

import { useConnection } from "hooks";
import {
  identifyReferrer,
  identifyUserWallet,
  identifyWalletChainId,
  setUserId,
} from "utils/amplitude";
import { ampli } from "ampli";
import { useFeatureFlagsContext } from "./feature-flags/useFeatureFlagsContext";

export function useInitialUserPropTraces(isAmpliLoaded: boolean) {
  const { fetchFlags } = useFeatureFlagsContext();
  const [areInitialUserPropsSet, setAreInitialUserPropsSet] = useState(false);
  const [prevTrackedAccount, setPrevTrackedAccount] = useState<
    string | undefined
  >();
  const [didApplicationLoad, setDidApplicationLoad] = useState(false);

  const { connector, account, chainId } = useConnection();

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

      // Fetch feature flags AFTER userId is set
      await fetchFlags();
      setPrevTrackedAccount(account);
    })();
  }, [
    isAmpliLoaded,
    areInitialUserPropsSet,
    account,
    prevTrackedAccount,
    chainId,
    connector,
    fetchFlags,
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
