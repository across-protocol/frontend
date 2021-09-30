import { useCallback } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { bindActionCreators } from "redux";
import type { RootState, AppDispatch } from "./";
import { set } from "./selectedAddress";
import {
  connect,
  disconnect,
  update,
  error as errorAction,
} from "./connection";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useSelectedAddress() {
  const address = useAppSelector((state) => state.selectedAddress);
  const dispatch = useAppDispatch();
  const actions = bindActionCreators({ set }, dispatch);

  return { address, setAddress: actions.set, dispatch };
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

export { useBalances, useETHBalance } from "./chain";
