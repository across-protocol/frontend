import { useEffect, useState } from "react";
import { providers } from "ethers";

import { useConnection } from "hooks";
import { hubPoolChainId } from "utils";

export function useIsWrongNetwork() {
  const { chainId, setChain } = useConnection();

  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    setIsWrongNetwork(String(chainId) !== String(hubPoolChainId));
  }, [chainId]);

  const isWrongNetworkHandler = async () => {
    const didSetChain = await setChain({
      chainId: `0x${hubPoolChainId.toString(16)}`,
    });

    if (!didSetChain) {
      throw new Error(
        `Wrong network. Please switch to network ${
          providers.getNetwork(hubPoolChainId).name
        }`
      );
    }
  };

  return {
    isWrongNetwork,
    isWrongNetworkHandler,
  };
}
