import { useMemo, useState, useEffect } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { ethers } from "ethers";
import { bindActionCreators } from "redux";
import { ChainId, getConfig, Token, getCode, noContractCode } from "utils";
import type { RootState, AppDispatch } from "./";

import chainApi from "./chainApi";
import { add } from "./transactions";
import { useOnboard } from "hooks/useOnboard";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useConnection() {
  const [isContractAddress, setIsContractAddress] = useState(false);
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

  useEffect(() => {
    setIsContractAddress(false);
    if (account && chainId) {
      const addr = ethers.utils.getAddress(account.address);
      getCode(addr, chainId)
        .then((res) => {
          setIsContractAddress(res !== noContractCode);
        })
        .catch((err) => {
          console.log("err in getCode call", err);
        });
    }
  }, [account, chainId]);

  return {
    account: account ? ethers.utils.getAddress(account.address) : undefined,
    ensName: account?.ens,
    chainId,
    provider,
    signer,
    isConnected,
    notify,
    connect,
    disconnect,
    error,
    wallet,
    isContractAddress,
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
