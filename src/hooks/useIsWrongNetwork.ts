import { useCallback, useEffect, useState } from "react";

import { useConnection } from "hooks";
import { hubPoolChainId, chainInfoTable } from "utils";

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
  }, [checkWrongNetworkHandler]);

  const isWrongNetworkHandler = async () => {
    const didSetChain = await setChain({
      chainId: `0x${correctChainId.toString(16)}`,
    });

    if (!didSetChain) {
      throw new Error(
        `Wrong network. Please switch to network ${chainInfoTable[correctChainId]?.name}`
      );
    }
  };

  const isWrongNetworkHandlerWithoutError = async () => {
    try {
      await isWrongNetworkHandler();
    } catch (error) {
      console.error(error);
    }
  };

  return {
    isWrongNetwork,
    isWrongNetworkHandler,
    checkWrongNetworkHandler,
    isWrongNetworkHandlerWithoutError,
  };
}
