import { useConnection } from "state/hooks";
import { onboard } from "utils";

import { useClaim } from "./useClaim";
import { useClaimableTokens } from "./useClaimableTokens";
import { useIsEligible } from "./useIsEligible";

export function useClaimView() {
  const { init } = onboard;
  const { isConnected } = useConnection();

  const isEligibleQuery = useIsEligible();
  const claimableTokensQuery = useClaimableTokens();

  const { handleClaim, claimState } = useClaim();

  return {
    handleConnectWallet: init,
    isConnected,
    isEligibleQuery,
    claimableTokensQuery,
    handleClaim,
    claimState,
  };
}
