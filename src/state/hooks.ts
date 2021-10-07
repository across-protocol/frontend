import { useCallback } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import type { RootState, AppDispatch } from "./";
import { address, fromChain, toChain, amount, asset } from "./selectedSendArgs";
import {
  connect,
  disconnect,
  update,
  error as errorAction,
} from "./connection";

import { transfer, toggle } from "./transfers";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useSelectedSendArgs() {
  const state = useAppSelector((state) => state.selectedSendArgs);
  const dispatch = useAppDispatch();
  const actions = bindActionCreators(
    { address, fromChain, toChain, amount, asset },
    dispatch
  );

  return {
    ...state,
    setAddress: actions.address,
    setStartingChain: actions.fromChain,
    setTargetChain: actions.toChain,
    setAmount: actions.amount,
    setAsset: actions.asset,
    dispatch,
  };
}

export function useConnection() {
  const { account, provider, signer, error, connector, chainId, isConnected } =
    useAppSelector((state) => state.connection);
  const dispatch = useAppDispatch();
  const actions = bindActionCreators(
    { connect, disconnect, update, errorAction },
    dispatch
  );

  const setUpdate = useCallback(
    (newUpdate) => {
      if (error) {
        actions.errorAction(undefined);
      }
      actions.update(newUpdate);
    },
    [actions, error]
  );

  return {
    provider,
    account,
    chainId,
    connector,
    error,
    signer,
    isConnected,
    setError: actions.errorAction,
    update: setUpdate,
    disconnect: actions.disconnect,
    connect: actions.connect,
  };
}

export function useGlobal() {
  return useAppSelector((state) => state.global);
}

export function useAccounts() {
  const state = useGlobal();
  return state.chains[state.currentChainId].accounts;
}

export function useTransfers() {
  const state = useAppSelector((state) => state.transfers);
  const dispatch = useAppDispatch();
  const { transfer: addTransfer, toggle: toggleShowLatestTransfer } =
    bindActionCreators({ transfer, toggle }, dispatch);
  return { ...state, addTransfer, toggleShowLatestTransfer };
}

export { useBalances, useETHBalance } from "./chain";
