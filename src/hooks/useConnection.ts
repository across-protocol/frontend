import { ethers } from "ethers";

import { useOnboard } from "hooks/useOnboard";
import { useIsContractAddress } from "hooks/useIsContractAddress";

export function useConnection() {
  const {
    provider,
    signer,
    isConnected,
    connect,
    disconnect,
    account,
    chainId,
    wallet,
    error,
    setChain,
    didAttemptAutoSelect,
  } = useOnboard();

  const isContractAddress = useIsContractAddress(account?.address, chainId);

  return {
    account: account ? ethers.utils.getAddress(account.address) : undefined,
    ensName: account?.ens?.name,
    chainId,
    provider,
    signer,
    isConnected,
    connect,
    disconnect,
    error,
    wallet,
    setChain,
    isContractAddress,
    didAttemptAutoSelect,
  };
}
