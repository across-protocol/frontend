import { useCallback, useEffect, useState } from "react";

import { hubPoolChainId, chainInfoTable, getEcosystem } from "utils";
import { useConnectionEVM } from "./useConnectionEVM";
import { useConnectionSVM } from "./useConnectionSVM";

export function useIsWrongNetwork(baseChain?: number) {
  const correctChainId = baseChain ?? hubPoolChainId;
  const ecosystem = getEcosystem(correctChainId);

  const {
    chainId,
    isConnected: isConnectedEVM,
    setChain: setChainEVM,
  } = useConnectionEVM();
  const { isConnected: isConnectedSVM, connect: connectSVM } =
    useConnectionSVM();

  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  const checkWrongNetworkHandler = useCallback(() => {
    if (ecosystem === "evm") {
      setIsWrongNetwork(
        isConnectedEVM && String(chainId) !== String(correctChainId)
      );
    } else {
      setIsWrongNetwork(!isConnectedSVM);
    }
  }, [chainId, correctChainId, isConnectedEVM, ecosystem, isConnectedSVM]);

  useEffect(() => {
    checkWrongNetworkHandler();
  }, [checkWrongNetworkHandler]);

  const isWrongNetworkHandler = useCallback(async () => {
    if (ecosystem === "evm") {
      const chain = await setChainEVM(correctChainId);

      if (chain.id !== correctChainId) {
        throw new Error(
          `Wrong network. Please switch to network ${chainInfoTable[correctChainId]?.name}`
        );
      }
    } else {
      connectSVM();
    }
  }, [correctChainId, ecosystem, setChainEVM, connectSVM]);

  const isWrongNetworkHandlerWithoutError = useCallback(async () => {
    try {
      await isWrongNetworkHandler();
    } catch (error) {
      console.error(error);
    }
  }, [isWrongNetworkHandler]);

  return {
    isWrongNetwork,
    isWrongNetworkHandler,
    checkWrongNetworkHandler,
    isWrongNetworkHandlerWithoutError,
  };
}
