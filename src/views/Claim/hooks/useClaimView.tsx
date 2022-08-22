import { useEffect, useState } from "react";
import { useConnection } from "state/hooks";
import { onboard } from "utils";

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
    | {
        status: "idle";
      }
    | {
        status: "loading";
      }
    | {
        status: "success";
        isEligible: boolean;
      }
    | {
        status: "error";
        error: Error;
      }
  >({ status: "idle" });

  useEffect(() => {
    if (isConnected && account) {
      isAccountEligible(account)
        .then((isEligible) => {
          setEligibleState({
            status: "success",
            isEligible,
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
