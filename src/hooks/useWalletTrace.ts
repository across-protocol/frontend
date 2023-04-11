/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { utils } from "ethers";

import {
  trackWalletConnectTransactionCompleted,
  chainInfoTable,
  CACHED_WALLET_KEY,
} from "utils";
import { ampli } from "ampli";
import { useConnection, useAmplitude } from "hooks";

export function useWalletTrace() {
  useWalletNetworkTrace();
  useWalletChangeTrace();
}

export function useWalletNetworkTrace() {
  const [prevTracked, setPrevTracked] = useState<
    { account: string; chainId: number } | undefined
  >();
  const { addToAmpliQueue } = useAmplitude();

  const { account, chainId } = useConnection();

  useEffect(() => {
    if (!chainId || !account) {
      return;
    }

    if (prevTracked?.account === account && prevTracked?.chainId === chainId) {
      return;
    }

    const chainInfo = chainInfoTable[Number(chainId)];
    addToAmpliQueue(async () => {
      await ampli.walletNetworkSelected({
        chainId: String(chainId),
        chainName: chainInfo?.name || "unknown",
      }).promise;
    });
    setPrevTracked({ account, chainId });
  }, [chainId, account]);
}

export function useWalletChangeTrace() {
  const [prevTrackedWallet, setPrevTrackedWallet] = useState<
    string | undefined
  >();
  const { addToAmpliQueue } = useAmplitude();

  const { wallet } = useConnection();

  useEffect(() => {
    if (!wallet) {
      return;
    }

    const connectedWalletAddress = utils.getAddress(wallet.accounts[0].address);

    if (prevTrackedWallet === connectedWalletAddress) {
      return;
    }

    const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
    addToAmpliQueue(async () => {
      await trackWalletConnectTransactionCompleted(wallet, previousConnection)
        .promise;
    });

    setPrevTrackedWallet(connectedWalletAddress);
  }, [wallet]);
}
