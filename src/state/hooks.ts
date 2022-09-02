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
  const [showContractAddressWarning, setShowContractAddressWarning] =
    useState(false);
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
    setShowContractAddressWarning(false);
    if (account && chainId) {
      const addr = ethers.utils.getAddress(account.address);
      // Check to see if the toAddress they are inputting is a Contract on Mainnet
      // If so, warn user because we send WETH and this could cause loss of funds.
      // Note: Removed check for WETH and ETH because they can change tokens outside of this modal.
      getCode(addr, chainId)
        .then((addr) => {
          if (addr !== noContractCode) {
            console.log("in here?", addr);
            setShowContractAddressWarning(true);
          } else {
            setShowContractAddressWarning(false);
          }
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
    showContractAddressWarning,
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
