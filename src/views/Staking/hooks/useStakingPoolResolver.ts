import { useParams } from "react-router-dom";
import { TokenInfo, tokenList } from "utils";

type StakingPathParams = {
  poolId: string;
};

export const useStakingPoolResolver = () => {
  const { poolId } = useParams<StakingPathParams>();

  const resolvedToken: TokenInfo = {
    ...tokenList[0],
    decimals: 18,
    symbol: "TEST",
    mainnetAddress: "0xd35cceead182dcee0f148ebac9447da2c4d449c4",
  };

  return {
    poolId,
    exitLinkURI: "/rewards",
    poolLogoURI: resolvedToken.logoURI,
    poolName: resolvedToken.symbol.toUpperCase(),
    mainnetAddress: resolvedToken.mainnetAddress,
  };
};
