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
  MAX_APPROVAL_AMOUNT,
  optimismErc20Pairs,
  bobaErc20Pairs,
} from "utils";
import type { RootState, AppDispatch } from "./";
import { ErrorContext } from "context/ErrorContext";
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
import { useERC20 } from "hooks";
import { across } from "@uma/sdk";
import { Bridge } from "arb-ts";

const { clients } = across;
const { OptimismBridgeClient } = clients.optimismBridge;
const { BobaBridgeClient } = clients.bobaBridge;
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
  }, [currentlySelectedFromChain.chainId, error, removeError, addError]);

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
  const send = useAppSelector((state) => state.send);
  const sendAcross = useSendAcross();
  const sendOptimism = useSendOptimism();
  const sendArbitrum = useSendArbitrum();
  const sendBoba = useSendBoba();
  const setSend = {
    setToken: actions.tokenAction,
    setAmount: actions.amountAction,
    setFromChain: actions.fromChainAction,
    setToChain: actions.toChainAction,
    setToAddress: actions.toAddressAction,
    setError: actions.sendErrorAction,
  };

  if (send.fromChain === ChainId.MAINNET && send.toChain === ChainId.OPTIMISM) {
    return {
      ...send,
      ...setSend,
      ...sendOptimism,
    };
  }

  if (send.fromChain === ChainId.MAINNET && send.toChain === ChainId.ARBITRUM) {
    return {
      ...send,
      ...setSend,
      ...sendArbitrum,
    };
  }

  if (send.fromChain === ChainId.MAINNET && send.toChain === ChainId.BOBA) {
    return {
      ...send,
      ...setSend,
      ...sendBoba,
    };
  }

  return {
    ...send,
    ...setSend,
    ...sendAcross,
  };
}
export function useSendAcross() {
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
  const { balance } = useBalance({
    chainId: currentlySelectedFromChain.chainId,
    account,
    tokenAddress: token,
  });
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
  const { approve: rawApprove } = useERC20(token);
  const canApprove = balance.gte(amount) && amount.gte(0);
  const hasToApprove = allowance?.hasToApprove ?? false;

  async function approve() {
    return rawApprove({
      amount: MAX_APPROVAL_AMOUNT,
      spender: depositBox.address,
      signer,
    });
  }
  const hasToSwitchChain =
    isConnected && currentlySelectedFromChain.chainId !== chainId;

  const tokenSymbol =
    TOKENS_LIST[currentlySelectedFromChain.chainId].find(
      (t) => t.address === token
    )?.symbol ?? "";

  const { data: fees, isFetching: isFetchingFees } = useBridgeFees(
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
      !isFetchingFees &&
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
      isFetchingFees,
      toAddress,
      hasToApprove,
      hasToSwitchChain,
      error,
      balance,
    ]
  );

  const send = useCallback(async () => {
    if (
      !signer ||
      !canSend ||
      !fees ||
      isFetchingFees ||
      !toAddress ||
      !block
    ) {
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
    isFetchingFees,
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
    canSend,
    canApprove,
    hasToApprove,
    hasToSwitchChain,
    send,
    approve,
    fees: isFetchingFees ? undefined : fees,
    spender: depositBox.address,
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

export function useSendOptimism() {
  const [optimismBridge] = useState(new OptimismBridgeClient());
  const { isConnected, chainId, account, signer } = useConnection();
  const {
    fromChain,
    amount,
    token,
    currentlySelectedFromChain,
    currentlySelectedToChain,
    toAddress,
    error,
  } = useAppSelector((state) => state.send);
  const { block } = useL2Block();
  const { balance: balanceStr } = useBalance({
    chainId: fromChain,
    account,
    tokenAddress: token,
  });
  const bridgeAddress = useMemo(() => {
    try {
      return optimismBridge.getL1BridgeAddress(chainId as number);
    } catch (error) {
      return "";
    }
  }, [optimismBridge, chainId]);
  const balance = BigNumber.from(balanceStr);
  const { data: allowance } = useAllowance(
    {
      chainId: fromChain,
      token,
      owner: account!,
      spender: bridgeAddress,
      amount,
    },
    { skip: !account || !isConnected || !chainId }
  );
  const canApprove = balance.gte(amount) && amount.gte(0);
  const hasToApprove = allowance?.hasToApprove ?? true;
  //TODO: Add fees
  const [fees] = useState({
    instantRelayFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    slowRelayFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    lpFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    isAmountTooLow: false,
    isLiquidityInsufficient: false,
  });

  const send = useCallback(async () => {
    if (!isConnected || !signer) return {};
    if (token === ethers.constants.AddressZero) {
      return {
        tx: await optimismBridge.depositEth(signer, amount),
        fees,
      };
    } else {
      const pairToken = optimismErc20Pairs()[token];
      if (!pairToken) return {};
      return {
        tx: await optimismBridge.depositERC20(signer, token, pairToken, amount),
        fees,
      };
    }
  }, [amount, fees, token, isConnected, optimismBridge, signer]);

  const approve = useCallback(() => {
    if (!signer) return;
    return optimismBridge.approve(signer, token, MAX_APPROVAL_AMOUNT);
  }, [optimismBridge, signer, token]);

  const hasToSwitchChain =
    isConnected && currentlySelectedFromChain.chainId !== chainId;
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
      balance.gte(amount),
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

  return {
    canSend,
    canApprove,
    hasToApprove,
    hasToSwitchChain,
    send,
    approve,
    fees,
    spender: bridgeAddress,
  };
}

export function useSendArbitrum() {
  const [bridge, setBridge] = useState<Bridge | undefined>();
  const [bridgeAddress, setBridgeAddress] = useState("");
  const { isConnected, chainId, account, signer } = useConnection();
  const {
    fromChain,
    toChain,
    toAddress,
    amount,
    token,
    currentlySelectedFromChain,
    currentlySelectedToChain,
    error,
  } = useAppSelector((state) => state.send);
  const { block } = useL2Block();
  const { balance: balanceStr } = useBalance({
    chainId: fromChain,
    account,
    tokenAddress: token,
  });
  const balance = BigNumber.from(balanceStr);
  const [refetchAllowance, { data: allowance }] =
    chainApi.endpoints.allowance.useLazyQuery();
  const canApprove = balance.gte(amount) && amount.gte(0);
  const hasToApprove = allowance?.hasToApprove ?? true;
  //TODO: Add fees
  const [fees] = useState({
    instantRelayFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    slowRelayFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    lpFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    isAmountTooLow: false,
    isLiquidityInsufficient: false,
  });

  useEffect(() => {
    initBridgeClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, account, fromChain, toChain, isConnected]);

  const initBridgeClient = async () => {
    if (!signer || !account) return;
    if (fromChain !== ChainId.MAINNET) return;
    if (toChain !== ChainId.ARBITRUM) return;
    if (!isConnected) return;

    const provider = PROVIDERS[ChainId.ARBITRUM]();
    try {
      const bridge = await Bridge.init(signer, provider.getSigner(account));
      setBridge(bridge);
    } catch (error) {
      console.error(error);
    }
  };

  const send = useCallback(async () => {
    if (!bridge || !isConnected) return {};
    if (token === ethers.constants.AddressZero) {
      return {
        tx: await bridge.depositETH(amount),
        fees,
      };
    } else {
      const depositParams = await bridge.getDepositTxParams({
        erc20L1Address: token,
        amount,
        destinationAddress: toAddress,
      });
      return {
        tx: await bridge.deposit(depositParams),
        fees,
      };
    }
  }, [bridge, amount, fees, token, isConnected, toAddress]);

  const approve = useCallback(() => {
    if (!bridge) return;
    return bridge.approveToken(token, MAX_APPROVAL_AMOUNT);
  }, [bridge, token]);

  useEffect(() => {
    if (!bridge || !account || !token || !chainId || !amount) return;

    bridge.l1Bridge
      .getGatewayAddress(token)
      .then((spender) => {
        setBridgeAddress(spender);
        return refetchAllowance({
          owner: account,
          spender,
          chainId,
          token,
          amount,
        });
      })
      .catch(console.error);
  }, [bridge, amount, token, chainId, account, refetchAllowance]);

  const hasToSwitchChain =
    isConnected && currentlySelectedFromChain.chainId !== chainId;
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
      balance.gte(amount),
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

  return {
    canSend,
    canApprove,
    hasToApprove,
    hasToSwitchChain,
    send,
    approve,
    fees,
    spender: bridgeAddress,
  };
}

export function useSendBoba() {
  const [bobaBridge] = useState(new BobaBridgeClient());
  const [bridgeAddress, setBridgeAddress] = useState("");
  const { isConnected, chainId, account, signer } = useConnection();
  const {
    fromChain,
    amount,
    token,
    currentlySelectedFromChain,
    currentlySelectedToChain,
    toAddress,
    error,
  } = useAppSelector((state) => state.send);
  const { block } = useL2Block();
  const { balance: balanceStr } = useBalance({
    chainId: fromChain,
    account,
    tokenAddress: token,
  });
  const balance = BigNumber.from(balanceStr);
  const { data: allowance } = useAllowance(
    {
      chainId: fromChain,
      token,
      owner: account!,
      spender: bridgeAddress,
      amount,
    },
    { skip: !account || !isConnected || !chainId }
  );
  const canApprove = balance.gte(amount) && amount.gte(0);
  const hasToApprove = allowance?.hasToApprove ?? true;
  //TODO: Add fees
  const [fees] = useState({
    instantRelayFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    slowRelayFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    lpFee: {
      total: BigNumber.from("0"),
      pct: BigNumber.from("0"),
    },
    isAmountTooLow: false,
    isLiquidityInsufficient: false,
  });

  useEffect(() => {
    if (!bobaBridge) return;
    bobaBridge
      .getL1BridgeAddress(chainId as number, PROVIDERS[ChainId.MAINNET]())
      .then((address) => {
        setBridgeAddress(address);
      })
      .catch(() => {
        setBridgeAddress("");
      });
  }, [bobaBridge, chainId]);

  const send = useCallback(async () => {
    if (!isConnected || !signer) return {};
    if (token === ethers.constants.AddressZero) {
      return {
        tx: await bobaBridge.depositEth(signer, amount),
        fees,
      };
    } else {
      const pairToken = bobaErc20Pairs()[token];
      if (!pairToken) return {};
      return {
        tx: await bobaBridge.depositERC20(signer, token, pairToken, amount),
        fees,
      };
    }
  }, [amount, fees, token, isConnected, bobaBridge, signer]);

  const approve = useCallback(() => {
    if (!signer) return;
    return bobaBridge.approve(signer, token, MAX_APPROVAL_AMOUNT);
  }, [bobaBridge, signer, token]);

  const hasToSwitchChain =
    isConnected && currentlySelectedFromChain.chainId !== chainId;
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
      balance.gte(amount),
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

  return {
    canSend,
    canApprove,
    hasToApprove,
    hasToSwitchChain,
    send,
    approve,
    fees,
    spender: bridgeAddress,
  };
}
