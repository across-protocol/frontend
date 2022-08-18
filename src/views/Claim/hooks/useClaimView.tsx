import { useConnection } from "state/hooks";
import { onboard } from "utils";

import { useMerkleDistributor } from "./useMerkleDistributor";
import { useAirdropRecipient } from "./useAirdropRecipient";

export function useClaimView() {
  const { init } = onboard;
  const { isConnected, provider } = useConnection();

  const airdropRecipientQuery = useAirdropRecipient();
  const { handleClaim, claimState, hasClaimedState } = useMerkleDistributor();

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

  return {
    handleConnectWallet: init,
    handleAddTokenToWallet,
    isConnected,
    airdropRecipientQuery,
    handleClaim,
    claimState,
    hasClaimedState,
  };
}
