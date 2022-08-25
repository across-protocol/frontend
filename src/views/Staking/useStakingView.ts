import { useParams } from "react-router";
import { useConnection } from "state/hooks";
import { onboard, parseEther, TokenInfo, tokenList } from "utils";

type StakingPathParams = {
  poolId: string;
};

export const useStakingView = () => {
  const { poolId } = useParams<StakingPathParams>();
  const { isConnected, provider } = useConnection();
  let resolvedToken = determineRoute(poolId);

  // Trigger a re-route to 404
  if (!resolvedToken) {
    resolvedToken = tokenList[0];
  }

  return {
    poolId,
    exitLinkURI: "/rewards",
    poolLogoURI: resolvedToken.logoURI,
    poolName: resolvedToken.symbol.toUpperCase(),
    amountOfRewardsClaimable: parseEther("320.19"),
    isConnected: isConnected,
    provider: provider,
    connectWalletHandler: onboard.init,
  };
};

function determineRoute(poolId: string): TokenInfo | undefined {
  return tokenList.filter(
    (token) => token.symbol.toLowerCase() === poolId.toLowerCase()
  )[0];
}
