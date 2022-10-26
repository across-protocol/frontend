import { useEffect, useState } from "react";

import { useConnection } from "hooks";
import { hubPoolChainId, switchChain } from "utils";

export function useIsWrongNetwork() {
  const { provider, chainId } = useConnection();

  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    setIsWrongNetwork(String(chainId) !== String(hubPoolChainId));
  }, [chainId]);

  const isWrongNetworkHandler = () =>
    provider && switchChain(provider, hubPoolChainId);

  return {
    isWrongNetwork,
    isWrongNetworkHandler,
  };
}
