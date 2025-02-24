/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import { trackWalletConnectTransactionCompleted, chainInfoTable } from "utils";
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
    addToAmpliQueue(() => {
      ampli.walletNetworkSelected({
        chainId: String(chainId),
        chainName: chainInfo?.name || "unknown",
      });
    });
    setPrevTracked({ account, chainId });
  }, [chainId, account]);
}

export function useWalletChangeTrace() {
  const [prevTrackedWallet, setPrevTrackedWallet] = useState<
    string | undefined
  >();
  const { addToAmpliQueue } = useAmplitude();

  const { connector, account } = useConnection();

  useEffect(() => {
    if (!connector || !account) {
      return;
    }

    if (prevTrackedWallet === account) {
      return;
    }

    addToAmpliQueue(() => {
      trackWalletConnectTransactionCompleted(account, connector.name);
    });

    setPrevTrackedWallet(account);
  }, [account, connector]);
}
