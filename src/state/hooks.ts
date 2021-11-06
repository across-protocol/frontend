import { useCallback, useMemo, useEffect, useState } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { ethers, BigNumber } from "ethers";
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
import chainApi, { useAllowance, useBridgeFees } from "./chainApi";
import { add } from "./transactions";
import { deposit as depositAction, toggle } from "./deposits";

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

// TODO: put this back into global state. Wasnt able to get it working.
export function useBlocks(toChain: ChainId) {
  const [state, setBlock] = useState<
    (ethers.providers.Block & { blockNumber: number }) | undefined
  >();
  useEffect(() => {
    const provider = PROVIDERS[toChain]();
    provider
      .getBlock("latest")
      .then((block) => {
        setBlock({ ...block, blockNumber: block.number });
      })
      .catch((error) => console.error("Error getting block", error))
      .finally(() => {
        provider.on("block", async (blockNumber: number) => {
          const block = await provider.getBlock(blockNumber);
          setBlock({ ...block, blockNumber });
        });
      });

    return () => {
      provider.removeAllListeners();
    };
  }, [toChain]);

  return {
    block: state,
    setBlock: setBlock,
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

  const { balance } = useBalance({
    chainId: fromChain,
    account,
    tokenAddress: token,
  });
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
  const canApprove = balance.gte(amount) && amount.gte(0);
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
      !fees.isAmountTooLow &&
      !fees.isLiquidityInsufficient &&
      balance.gte(amount),
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
      balance,
    ]
  );
  const send = useCallback(async () => {
    if (!signer || !canSend || !fees || !toAddress || !block) {
      return {};
    }

    try {
      const depositBox = getDepositBox(fromChain, signer);
      const isETH = token === ethers.constants.AddressZero;
      const value = isETH ? amount : ethers.constants.Zero;
      const l2Token = isETH ? TOKENS_LIST[fromChain][0].address : token;
      const { instantRelayFee, slowRelayFee } = fees;
      const timestamp = block.timestamp;

      const tx = await depositBox.deposit(
        toAddress,
        l2Token,
        amount,
        slowRelayFee.pct,
        instantRelayFee.pct,
        timestamp,
        { value }
      );
      return { tx, fees };
    } catch (e) {
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
    canApprove,
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

export function useBalance(params: {
  chainId: ChainId;
  account?: string;
  tokenAddress: string;
}) {
  const { chainId, account, tokenAddress } = params;
  // const { data: balances, ...rest } = useBalances({ chainId, account });
  const [updateBalances, result] = chainApi.endpoints.balances.useLazyQuery();
  function refetch() {
    if (account) updateBalances({ chainId, account });
  }
  useEffect(refetch, [chainId, account, tokenAddress, updateBalances]);
  const tokenList = TOKENS_LIST[chainId];
  const selectedIndex = tokenList.findIndex(
    ({ address }) => address === tokenAddress
  );
  const balance = result?.data
    ? result.data[selectedIndex]
    : BigNumber.from("0");

  return {
    balance,
    refetch,
  };
}
