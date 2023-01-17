/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useWallets } from "@web3-onboard/react";
import { utils } from "ethers";

import {
  trackWalletChainId,
  trackWalletConnectTransactionCompleted,
  chainInfoTable,
  CACHED_WALLET_KEY,
  identifyUserWallets,
  setUserId,
} from "utils";
import { ampli } from "ampli";
import { useConnection } from "hooks";

export function useWalletTrace() {
  useWalletNetworkTrace();
  useWalletChangeTrace();
}

export function useWalletNetworkTrace() {
  const [prevTracked, setPrevTracked] = useState<
    { account: string; chainId: number } | undefined
  >();

  const { account, chainId } = useConnection();

  useEffect(() => {
    if (!chainId || !account) {
      return;
    }

    if (prevTracked?.account === account && prevTracked?.chainId === chainId) {
      return;
    }

    const chainInfo = chainInfoTable[Number(chainId)];
    setUserId(account);
    trackWalletChainId(chainId);
    ampli.walletNetworkSelected({
      chainId: String(chainId),
      chainName: chainInfo?.name || "unknown",
    });
    setPrevTracked({ account, chainId });
  }, [chainId, account]);
}

export function useWalletChangeTrace() {
  const [prevTrackedWallet, setPrevTrackedWallet] = useState<
    string | undefined
  >();

  const wallets = useWallets();

  useEffect(() => {
    if (wallets.length === 0) {
      return;
    }

    const [connectedWallet] = wallets;
    const connectedWalletAddress = utils.getAddress(
      connectedWallet.accounts[0].address
    );

    if (prevTrackedWallet === connectedWalletAddress) {
      return;
    }

    identifyUserWallets(wallets);
    const previousConnection = window.localStorage.getItem(CACHED_WALLET_KEY);
    trackWalletConnectTransactionCompleted(wallets, previousConnection);

    setPrevTrackedWallet(connectedWalletAddress);
  }, [wallets]);
}
