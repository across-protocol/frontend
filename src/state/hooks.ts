import { useCallback, useMemo } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import {
  getDepositBox,
  isValidAddress,
  TOKENS_LIST,
  PROVIDERS,
  TransactionError,
} from "utils";
import type { RootState, AppDispatch } from "./";
import { update, disconnect, error as errorAction } from "./connection";
import {
  token as tokenAction,
  amount as amountAction,
  fromChain as fromChainAction,
  toChain as toChainAction,
  toAddress as toAddressAction,
  error as sendErrorAction,
} from "./send";
import { useAllowance, useBridgeFees } from "./chainApi";
import { add } from "./transactions";
import { deposit as depositAction, toggle } from "./deposits";
import { ethers } from "ethers";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useConnection() {
  const { account, signer, provider, error, chainId } = useAppSelector(
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
  };
}

export function useSend() {
  const { isConnected, chainId, account, signer } = useConnection();
  const { fromChain, toChain, toAddress, amount, token, error } =
    useAppSelector((state) => state.send);
  const dispatch = useAppDispatch();
  const actions = bindActionCreators(
    {
      tokenAction,
      amountAction,
      fromChainAction,
      toChainAction,
      toAddressAction,
      sendErrorAction,
    },
    dispatch
  );

  const depositBox = getDepositBox(fromChain);
  const { data: allowance } = useAllowance(
    {
      chainId: fromChain,
      token: token,
      owner: account!,
      spender: depositBox.address,
      amount,
    },
    { skip: !account || !isConnected || !depositBox }
  );
  const hasToApprove = allowance?.hasToApprove ?? false;
  const hasToSwitchChain = isConnected && fromChain !== chainId;

  const tokenSymbol =
    TOKENS_LIST[fromChain].find((t) => t.address === token)?.symbol ?? "";
  const { data: fees } = useBridgeFees(
    {
      amount,
      tokenSymbol,
    },
    { skip: tokenSymbol === "" }
  );
  const canSend = useMemo(
    () =>
      fromChain &&
      toChain &&
      amount &&
      token &&
      fees &&
      toAddress &&
      isValidAddress(toAddress) &&
      !hasToApprove &&
      !hasToSwitchChain &&
      !error,
    [
      fromChain,
      toChain,
      amount,
      token,
      fees,
      toAddress,
      hasToApprove,
      hasToSwitchChain,
      error,
    ]
  );
  const send = useCallback(async () => {
    if (!signer || !canSend || !fees || !toAddress) {
      return;
    }
    let timestamp = NaN;
    try {
      const depositBox = getDepositBox(fromChain, signer);
      const isETH = token === ethers.constants.AddressZero;
      const value = isETH ? amount : ethers.constants.Zero;
      const l2Token = isETH ? TOKENS_LIST[fromChain][0].address : token;
      const { instantRelayFee, slowRelayFee } = fees;
      timestamp = (await PROVIDERS[toChain]().getBlock("latest")).timestamp;

      const tx = await depositBox.deposit(
        toAddress,
        l2Token,
        amount,
        slowRelayFee.pct,
        instantRelayFee.pct,
        timestamp,
        { value }
      );
      return tx;
    } catch (e) {
      console.error(e);
      throw new TransactionError(
        depositBox.address,
        "deposit",
        toAddress,
        token,
        amount,
        fees.slowRelayFee.pct,
        fees.instantRelayFee.pct,
        timestamp
      );
    }
  }, [
    amount,
    canSend,
    depositBox.address,
    fees,
    fromChain,
    signer,
    toAddress,
    toChain,
    token,
  ]);

  return {
    fromChain,
    toChain,
    toAddress,
    amount,
    token,
    error,
    setToken: actions.tokenAction,
    setAmount: actions.amountAction,
    setFromChain: actions.fromChainAction,
    setToChain: actions.toChainAction,
    setToAddress: actions.toAddressAction,
    setError: actions.sendErrorAction,
    canSend,
    hasToApprove,
    hasToSwitchChain,
    send,
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

export function useDeposits() {
  const { deposit, showConfirmationScreen } = useAppSelector(
    (state) => state.deposits
  );
  const dispatch = useAppDispatch();
  const actions = bindActionCreators({ depositAction, toggle }, dispatch);
  return {
    deposit,
    showConfirmationScreen,
    toggle: actions.toggle,
    addDeposit: actions.depositAction,
  };
}

export {
  useAllowance,
  useBalances,
  useETHBalance,
  useBridgeFees,
} from "./chainApi";
