import { useCallback, useMemo, useEffect } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { ethers } from "ethers";
import { bindActionCreators } from "redux";
import {
  getDepositBox,
  isValidAddress,
  TOKENS_LIST,
  PROVIDERS,
  TransactionError,
  ChainId,
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
import { setBlock } from "./blocks";
import { parseEther } from "@ethersproject/units";

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

export function useBlocks(toChain: ChainId) {
  const state = useAppSelector((state) => state.blocks);
  const dispatch = useAppDispatch();
  const actions = bindActionCreators({ setBlock }, dispatch);
  useEffect(() => {
    const provider = PROVIDERS[toChain]();
    provider.on("block", async (blockNumber: number) => {
      const block = await provider.getBlock(blockNumber);
      setBlock({ block: { ...block, blockNumber } });
    });
    return () => {
      provider.removeAllListeners();
    };
  }, [toChain]);
  return {
    block: state.block,
    setBlock: actions.setBlock,
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

  const { block } = useBlocks(toChain);

  const depositBox = getDepositBox(fromChain);
  const { data: allowance } = useAllowance(
    {
      chainId: fromChain,
      token,
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
      blockNumber: block?.blockNumber ?? 0,
    },
    { skip: tokenSymbol === "" || amount.lte(0) || !block }
  );
  const canSend = useMemo(
    () =>
      fromChain &&
      block &&
      toChain &&
      amount &&
      token &&
      fees &&
      toAddress &&
      isValidAddress(toAddress) &&
      !hasToApprove &&
      !hasToSwitchChain &&
      !error &&
      !fees.isAmountTooLow,
    [
      fromChain,
      block,
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
    if (!signer || !canSend || !fees || !toAddress || !block) {
      return;
    }

    try {
      const depositBox = getDepositBox(fromChain, signer);
      const isETH = token === ethers.constants.AddressZero;
      const value = isETH
        ? amount.sub(parseEther("0.002"))
        : ethers.constants.Zero;
      const l2Token = isETH ? TOKENS_LIST[fromChain][0].address : token;
      const { instantRelayFee, slowRelayFee } = fees;
      const timestamp = block.timestamp;

      const tx = await depositBox.deposit(
        toAddress,
        l2Token,
        isETH ? amount.sub(parseEther("0.002")) : amount,
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
        block.timestamp
      );
    }
  }, [
    amount,
    block,
    canSend,
    depositBox.address,
    fees,
    fromChain,
    signer,
    toAddress,
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
