/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { utils } from "ethers";

import {
  trackWalletConnectTransactionCompleted,
  chainInfoTable,
  CACHED_WALLET_KEY,
} from "utils";
import { ampli } from "ampli";
import { useConnection } from "hooks";

export function useWalletTrace(areInitialUserPropsSet: boolean) {
  useWalletNetworkTrace(areInitialUserPropsSet);
  useWalletChangeTrace(areInitialUserPropsSet);
}

export function useWalletNetworkTrace(areInitialUserPropsSet: boolean) {
  const [prevTracked, setPrevTracked] = useState<
    { account: string; chainId: number } | undefined
  >();

  const { account, chainId } = useConnection();

  useEffect(() => {
    if (!chainId || !account || !areInitialUserPropsSet) {
      return;
    }

    if (prevTracked?.account === account && prevTracked?.chainId === chainId) {
      return;
    }

    const chainInfo = chainInfoTable[Number(chainId)];
    ampli.walletNetworkSelected({
      chainId: String(chainId),
      chainName: chainInfo?.name || "unknown",
    });
    setPrevTracked({ account, chainId });
  }, [chainId, account, areInitialUserPropsSet]);
}

export function useWalletChangeTrace(areInitialUserPropsSet: boolean) {
  const [prevTrackedWallet, setPrevTrackedWallet] = useState<
    string | undefined
  >();

  const { wallet } = useConnection();

  useEffect(() => {
    if (!wallet || !areInitialUserPropsSet) {
      return;
    }

    const connectedWalletAddress = utils.getAddress(wallet.accounts[0].address);

    if (prevTrackedWallet === connectedWalletAddress) {
      return;
    }

    const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
    trackWalletConnectTransactionCompleted(wallet, previousConnection);

    setPrevTrackedWallet(connectedWalletAddress);
  }, [wallet, areInitialUserPropsSet]);
}
