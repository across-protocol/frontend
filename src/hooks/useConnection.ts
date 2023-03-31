import { useState, useEffect } from "react";
import { useOnboard } from "hooks/useOnboard";
import { ethers } from "ethers";
import { getCode, noContractCode } from "utils";

export function useConnection() {
  const [isContractAddress, setIsContractAddress] = useState(false);
  const {
    provider,
    signer,
    isConnected,
    connect,
    disconnect,
    notify,
    account,
    chainId,
    wallet,
    error,
    setChain,
    setNotifyConfig,
    didAttemptAutoSelect,
  } = useOnboard();

  useEffect(() => {
    setIsContractAddress(false);
    if (account && chainId) {
      const addr = ethers.utils.getAddress(account.address);
      getCode(addr, chainId)
        .then((res) => {
          setIsContractAddress(res !== noContractCode);
        })
        .catch((err) => {
          console.log("err in getCode call", err);
        });
    }
  }, [account, chainId]);

  return {
    account: account ? ethers.utils.getAddress(account.address) : undefined,
    ensName: account?.ens?.name,
    chainId,
    provider,
    signer,
    isConnected,
    notify,
    setNotifyConfig,
    connect,
    disconnect,
    error,
    wallet,
    setChain,
    isContractAddress,
    didAttemptAutoSelect,
  };
}
