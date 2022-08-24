import { useEffect, useState } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";

import { AsyncState } from "../types";

export function useClaimView() {
  const { init } = onboard;
  const { isConnected } = useConnection();

  const eligibleState = useIsEligible();

  return {
    connectWallet: init,
    isConnected,
    eligibleState,
  };
}

function useIsEligible() {
  const { isConnected, account } = useConnection();

  const [eligibleState, setEligibleState] = useState<
    AsyncState<{ isEligible: boolean }>
  >({ status: "idle" });

  useEffect(() => {
    if (isConnected && account) {
      isAccountEligible(account)
        .then((isEligible) => {
          setEligibleState({
            status: "success",
            data: { isEligible },
          });
        })
        .catch((error) => {
          setEligibleState({
            status: "error",
            error,
          });
        });
    }
  }, [isConnected, account]);

  return eligibleState;
}

// TODO: use correct method
async function isAccountEligible(account: string) {
  return false;
}
