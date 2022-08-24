import { useConnection } from "state/hooks";
import { onboard } from "utils";

import { useClaim } from "./useClaim";
import { useClaimableTokens } from "./useClaimableTokens";
import { useIsEligible } from "./useIsEligible";

export function useClaimView() {
  const { init } = onboard;
  const { isConnected, provider } = useConnection();

  const isEligibleQuery = useIsEligible();
  const claimableTokensQuery = useClaimableTokens();
  const { handleClaim, claimState } = useClaim();

  const handleAddTokenToWallet = async () => {
    if (provider) {
      await (provider as any).send("wallet_watchAsset", {
        type: "ERC20",
        options: {
          address: "0xb60e8dd61c5d32be8058bb8eb970870f07233155", // TODO
          symbol: "ACX",
          decimals: 18,
          image: "https://foo.io/token-image.svg", // TODO
        },
      });
    }
  };

  const alreadyClaimed = claimableTokensQuery.data
    ? claimableTokensQuery.data.claimedAmount.gte(
        claimableTokensQuery.data.totalClaim
      )
    : false;

  return {
    handleConnectWallet: init,
    handleAddTokenToWallet,
    isConnected,
    isEligibleQuery,
    claimableTokensQuery,
    handleClaim,
    claimState,
    alreadyClaimed,
  };
}
