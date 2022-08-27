import { useMemo } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { ethers } from "ethers";
import { bindActionCreators } from "redux";
import { ChainId, getConfig, Token } from "utils";
import type { RootState, AppDispatch } from "./";
import { update, error as errorAction } from "./connection";

import chainApi from "./chainApi";
import { add } from "./transactions";
import { useOnboard } from "hooks/useOnboard";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useConnection() {
  // const { error } = useAppSelector((state) => state.connection);
  // const e: Error | undefined = error;
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
  } = useOnboard();

  const dispatch = useAppDispatch();
  const actions = useMemo(
    () => bindActionCreators({ update, errorAction }, dispatch),
    [dispatch]
  );

  return {
    account: account?.address || undefined,
    ensName: account?.ens || undefined,
    chainId,
    provider,
    signer,
    isConnected,
    notify,
    connect,
    disconnect,
    error,
    setUpdate: actions.update,
    setError: actions.errorAction,
    wallet,
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
