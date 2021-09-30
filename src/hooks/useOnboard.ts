import React from "react";
import { Wallet } from "bnc-onboard/dist/src/interfaces";
import Onboard from "bnc-onboard";
import { ethers } from "ethers";

import { useConnection } from "../state/hooks";
import { onboardBaseConfig } from "../utils/constants";
import { UnsupportedChainIdError, isValidChainId } from "../utils/chainId";

export function useOnboard() {
  const { connect, disconnect, update, setError } = useConnection();
  const instance = React.useMemo(
    () =>
      Onboard({
        ...onboardBaseConfig(10),
        subscriptions: {
          address: (address: string) => {
            update({ account: address });
          },
          network: (networkId: number) => {
            const error = isValidChainId(networkId)
              ? undefined
              : new UnsupportedChainIdError(networkId);
            update({
              chainId: networkId,
            });
            if (error) {
              setError(error);
            }
          },
          wallet: async (wallet: Wallet) => {
            if (wallet.provider) {
              const provider = new ethers.providers.Web3Provider(
                wallet.provider
              );

              update({
                provider,
              });
            }
          },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const init = React.useCallback(async () => {
    try {
      await instance.walletSelect();
      await instance.walletCheck();
      const state = instance.getState();
      connect({
        connector: instance,
        chainId: state.network,
        account: state.address,
        provider: new ethers.providers.Web3Provider(state.wallet.provider),
      });
    } catch (err: unknown) {
      setError(err as Error);
    }
  }, [connect, instance, setError]);
  const reset = React.useCallback(() => {
    instance.walletReset();
    disconnect();
  }, [instance, disconnect]);
  return { init, reset };
}
