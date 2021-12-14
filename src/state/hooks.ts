import { useCallback, useMemo, useEffect, useState, useContext } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import useInterval from "@use-it/interval";
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
import { ErrorContext } from "context/ErrorContext";

const FEE_ESTIMATION = "0.004";

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
export function useL2Block() {
  const { currentlySelectedFromChain } = useAppSelector((state) => state.send);
  const [latestBlock, setBlock] = useState<
    ethers.providers.Block | undefined
  >();

  const { addError, removeError, error } = useContext(ErrorContext);

  useEffect(() => {
    const provider = PROVIDERS[currentlySelectedFromChain.chainId]();
    provider
      .getBlock("latest")
      .then((res) => {
        if (error) removeError();
        setBlock(res);
      })
      .catch(() => {
        addError(new Error("Infura issue, please try again later."));
        console.error("Error getting latest block");
      });
  }, [
    currentlySelectedFromChain.chainId,
    error,
    removeError,
    addError,
  ]);

  useInterval(() => {
    const provider = PROVIDERS[currentlySelectedFromChain.chainId]();
    provider
      .getBlock("latest")
      .then((block) => {
        setBlock(block);
      })
      .catch(() => {
        console.error("Error getting latest block");
      });

    return () => {
      provider.removeAllListeners();
    };
  }, 30 * 1000);

  return { block: latestBlock };
}

export function useSend() {
  const { isConnected, chainId, account, signer } = useConnection();
  const {
    fromChain,
    toChain,
    toAddress,
    amount,
    token,
    error,
    currentlySelectedFromChain,
    currentlySelectedToChain,
  } = useAppSelector((state) => state.send);
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

  const { balance: balanceStr } = useBalance({
    chainId: currentlySelectedFromChain.chainId,
    account,
    tokenAddress: token,
  });
  const balance = BigNumber.from(balanceStr);
  const { block } = useL2Block();

  const depositBox = getDepositBox(currentlySelectedFromChain.chainId);
  const { data: allowance } = useAllowance(
    {
      chainId: currentlySelectedFromChain.chainId,
      token,
      owner: account!,
      spender: depositBox.address,
      amount,
    },
    { skip: !account || !isConnected || !depositBox }
  );
  const canApprove = balance.gte(amount) && amount.gte(0);
  const hasToApprove = allowance?.hasToApprove ?? false;

  const hasToSwitchChain =
    isConnected && currentlySelectedFromChain.chainId !== chainId;

  const tokenSymbol =
    TOKENS_LIST[currentlySelectedFromChain.chainId].find(
      (t) => t.address === token
    )?.symbol ?? "";

  const { data: fees } = useBridgeFees(
    {
      amount,
      tokenSymbol,
      blockTime: block?.timestamp!,
    },
    { skip: tokenSymbol === "" || amount.lte(0) || !block?.timestamp }
  );

  const canSend = useMemo(
    () =>
      currentlySelectedFromChain.chainId &&
      block &&
      currentlySelectedToChain.chainId &&
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
      balance
        .sub(
          token === "0x0000000000000000000000000000000000000000"
            ? BigNumber.from(ethers.utils.parseEther(FEE_ESTIMATION))
            : BigNumber.from("0")
        )
        .gte(amount),
    [
      currentlySelectedFromChain.chainId,
      block,
      currentlySelectedToChain.chainId,
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
      const depositBox = getDepositBox(
        currentlySelectedFromChain.chainId,
        signer
      );
      const isETH = token === ethers.constants.AddressZero;
      const value = isETH ? amount : ethers.constants.Zero;
      const l2Token = isETH
        ? TOKENS_LIST[currentlySelectedFromChain.chainId][0].address
        : token;
      const { instantRelayFee, slowRelayFee } = fees;
      let timestamp = block.timestamp;

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
    currentlySelectedFromChain.chainId,
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
  const balance =
    result?.data && result.data[selectedIndex]
      ? result.data[selectedIndex].toString()
      : "0";

  return {
    balance,
    refetch,
  };
}
