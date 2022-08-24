import { useMemo, useEffect, useState } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { ethers } from "ethers";
import { bindActionCreators } from "redux";
import { ChainId, getConfig, onboard, Token } from "utils";
import type { RootState, AppDispatch } from "./";
import { update, disconnect, error as errorAction } from "./connection";

import chainApi from "./chainApi";
import { add } from "./transactions";
import { useOnboard } from "hooks/useOnboard";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useConnection() {
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const { account, ensName, signer, error, chainId, notify } = useAppSelector(
    (state) => state.connection
  );
  const oc = useOnboard();
  console.log(">>>>onboardContext", oc);

  const dispatch = useAppDispatch();
  const actions = useMemo(
    () => bindActionCreators({ update, disconnect, errorAction }, dispatch),
    [dispatch]
  );

  const w = oc.wallet;
  console.log("chainid?", Number(w?.chains[0].id));
  console.log(oc.onboard?.state.get());

  useEffect(() => {
    if (oc.wallet?.provider) {
      setProvider(new ethers.providers.Web3Provider(oc.wallet.provider, "any"));
    }
  }, [oc.wallet]);

  const isConnected = !!chainId && !!signer && !!account;
  return {
    account: w?.accounts[0].address,
    ensName,
    chainId: Number(w?.chains[0].id) as ChainId,
    provider,
    signer,
    error,
    isConnected: oc.isConnected,
    setUpdate: actions.update,
    disconnect: actions.disconnect,
    setError: actions.errorAction,
    notify,
    connect: oc.connect,
  };
}

export function useTransactions() {
  const { transactions } = useAppSelector((state) => state.transactions);
  const dispatch = useAppDispatch();
  const actions = bindActionCreators({ add }, dispatch);
  return {
    transactions,
    addTransaction: actions.add,
  };
}

export { useAllowance, useBalances, useETHBalance } from "./chainApi";

type useBalanceParams = {
  chainId: ChainId;
  account?: string;
  token: Token;
};
export function useBalance({ chainId, account, token }: useBalanceParams) {
  const config = getConfig();
  const tokenList = config.getTokenList(chainId);
  const { data: allBalances, refetch } = chainApi.endpoints.balances.useQuery(
    {
      account: account ?? "",
      chainId,
    },
    { skip: !account }
  );
  const selectedIndex = useMemo(
    () =>
      tokenList.findIndex(
        ({ address, isNative }) =>
          address === token.address && isNative === token.isNative
      ),
    [token, tokenList]
  );
  const balance = allBalances?.[selectedIndex] ?? ethers.BigNumber.from(0);

  return {
    balance,
    refetch,
  };
}
