import { useCallback, useEffect, useState } from "react";
import { providers } from "ethers";

import { useConnection } from "hooks";
import { hubPoolChainId } from "utils";

export function useIsWrongNetwork(baseChain?: number) {
  const correctChainId = baseChain ?? hubPoolChainId;

  const { chainId, isConnected, setChain } = useConnection();

  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  const checkWrongNetworkHandler = useCallback(() => {
    setIsWrongNetwork(
      isConnected && String(chainId) !== String(correctChainId)
    );
  }, [isConnected, chainId, correctChainId]);

  useEffect(() => {
    checkWrongNetworkHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkWrongNetworkHandler]);

  const isWrongNetworkHandler = async () => {
    const didSetChain = await setChain({
      chainId: `0x${correctChainId.toString(16)}`,
    });

    if (!didSetChain) {
      throw new Error(
        `Wrong network. Please switch to network ${
          providers.getNetwork(correctChainId).name
        }`
      );
    }
  };

  const isWrongNetworkHandlerWithoutError = async () => {
    try {
      await isWrongNetworkHandler();
    } catch (_e) {
      console.error(
        `Wrong network. Please switch to network ${
          providers.getNetwork(correctChainId).name
        }`
      );
    }
  };

  return {
    isWrongNetwork,
    isWrongNetworkHandler,
    checkWrongNetworkHandler,
    isWrongNetworkHandlerWithoutError,
  };
}
