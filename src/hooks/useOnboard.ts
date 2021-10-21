import React from "react";
import Onboard from "bnc-onboard";
import { Wallet } from "bnc-onboard/dist/src/interfaces";
import { ethers } from "ethers";
import {
  onboardBaseConfig,
  UnsupportedChainIdError,
  isSupportedChainId,
} from "utils";
import { useConnection } from "state/hooks";

export function useOnboard() {
  const { disconnect, setUpdate, setError } = useConnection();

  const instance = React.useMemo(
    () =>
      Onboard({
        ...onboardBaseConfig(),
        subscriptions: {
          address: (address: string) => {
            setUpdate({ account: address });
          },
          network: (chainIdInHex) => {
            if (chainIdInHex == null) {
              return;
            }
            const chainId = ethers.BigNumber.from(chainIdInHex).toNumber();

            if (!isSupportedChainId(chainId)) {
              setError({ error: new UnsupportedChainIdError(chainId) });
            } else {
              setUpdate({ chainId });
            }
          },
          wallet: (wallet: Wallet) => {
            if (wallet?.provider?.selectedAddress) {
              const provider = new ethers.providers.Web3Provider(
                wallet.provider
              );
              const signer = provider.getSigner();
              const chainId = ethers.BigNumber.from(
                wallet.provider.chainId
              ).toNumber();
              if (!isSupportedChainId(chainId)) {
                setError({ error: new UnsupportedChainIdError(chainId) });
              } else {
                setUpdate({
                  account: wallet.provider.selectedAddress,
                  chainId,
                  provider,
                  signer,
                });
              }
            } else {
              disconnect();
            }
          },
        },
      }),
    [setUpdate, setError, disconnect]
  );

  const init = React.useCallback(async () => {
    try {
      await instance.walletSelect();
      await instance.walletCheck();
    } catch (error: unknown) {
      setError({ error: new Error("Could not initialize Onboard.") });
    }
  }, [instance, setError]);
  const reset = React.useCallback(() => {
    instance.walletReset();
    disconnect();
  }, [instance, disconnect]);
  return { init, reset };
}
