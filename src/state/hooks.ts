import { useMemo } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";


import { ethers } from "ethers";
import { bindActionCreators } from "redux";
import {

  TOKENS_LIST,

  ChainId,

} from "utils";
import type { RootState, AppDispatch } from "./";
import { update, disconnect, error as errorAction } from "./connection";

import chainApi from "./chainApi";
import { add } from "./transactions";






// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useConnection() {
  const { account, signer, provider, error, chainId, notify } = useAppSelector(
    (state) => state.connection
  );

  const dispatch = useAppDispatch();
  const actions = useMemo(
    () => bindActionCreators({ update, disconnect, errorAction }, dispatch),
    [dispatch]
  );

  const isConnected = !!chainId && !!signer && !!account;
  return {
    account,
    chainId,
    provider,
    signer,
    error,
    isConnected,
    setUpdate: actions.update,
    disconnect: actions.disconnect,
    setError: actions.errorAction,
    notify,
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



export {
  useAllowance,
  useBalances,
  useETHBalance,
  useBridgeFees,
} from "./chainApi";

type useBalanceParams = {
  chainId: ChainId;
  account?: string;
  tokenAddress: string;
};
export function useBalance({
  chainId,
  account,
  tokenAddress,
}: useBalanceParams) {
  const { data: allBalances, refetch } = chainApi.endpoints.balances.useQuery(
    {
      account: account ?? "",
      chainId,
    },
    { skip: !account }
  );
  const selectedIndex = useMemo(
    () =>
      TOKENS_LIST[chainId].findIndex(({ address }) => address === tokenAddress),
    [chainId, tokenAddress]
  );
  const balance = allBalances?.[selectedIndex] ?? ethers.BigNumber.from(0);

  return {
    balance,
    refetch,
  };
}

