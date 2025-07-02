import { ethers } from "ethers";

import { useOnboard } from "hooks/useOnboard";
import { useAddressType } from "hooks/useAddressType";

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

  const addressType = useAddressType(account?.address, chainId);

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
    isContractAddress: addressType === "contract",
    didAttemptAutoSelect,
  };
}
