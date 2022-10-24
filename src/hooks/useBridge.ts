import { useEffect } from "react";
import { ethers } from "ethers";
import { FormStatus, useSendForm } from "./useSendForm";
import { useBalanceBySymbol } from "./useBalance";
import { useBridgeFees } from "./useBridgeFees";
import { useAllowance } from "./useAllowance";
import { useConnection } from "hooks";
import { useBlock } from "./useBlock";
import {
  FEE_ESTIMATION,
  InsufficientBalanceError,
  FeeTooHighError,
  InsufficientLiquidityError,
  MAX_APPROVAL_AMOUNT,
  WrongNetworkError,
  ChainId,
  sendAcrossDeposit,
  sendAcrossApproval,
  getConfig,
  parseUnits,
  trackEvent,
  formatUnits,
  QUOTE_TIMESTAMP_BUFFER,
} from "utils";
import useReferrer from "./useReferrer";
import { useToast } from "components/Toast/useToast";

enum SendStatus {
  IDLE = "idle",
  VALIDATING = "validating",
  READY = "ready",
  ERROR = "error",
}
type SendError =
  | InsufficientBalanceError
  | FeeTooHighError
  | InsufficientLiquidityError
  | WrongNetworkError;

export function useBridge() {
  const config = getConfig();
  const { referrer, error: referrerError } = useReferrer();
  const { chainId, account, signer } = useConnection();
  const { addToast } = useToast();
  useEffect(() => {
    if (referrerError) {
      addToast({
        type: "error",
        title: "Error",
        body: referrerError,
        createdAt: Date.now(),
        id: "referrer-error",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrerError]);

  const {
    amount,
    fromChain,
    toChain,
    tokenSymbol,
    toAddress,
    status: formStatus,
    selectedRoute,
  } = useSendForm();

  const { block } = useBlock(fromChain);
  const { balance } = useBalanceBySymbol(tokenSymbol, fromChain, account);
  const spokePool = fromChain ? config.getSpokePool(fromChain) : undefined;
  const { allowance } = useAllowance(
    tokenSymbol,
    fromChain,
    account,
    spokePool?.address,
    block?.number
  );
  const tokenInfo =
    fromChain && tokenSymbol
      ? config.getTokenInfoBySymbol(fromChain, tokenSymbol)
      : undefined;
  const { fees } = useBridgeFees(amount, fromChain, toChain, tokenSymbol);
  const hasToSwitchChain = Boolean(
    fromChain && chainId && chainId !== fromChain
  );
  let { status, error } = computeStatus({
    tokenSymbol: tokenInfo?.symbol,
    amount,
    formStatus,
    hasToSwitchChain,
    balance,
    fees,
    fromChain,
  });

  const hasToApprove = !!allowance && amount.gt(allowance);
  const hubPool = config.getHubPool();

  const send = async () => {
    // NOTE: the `toAddress` check is redundant, as status won't be "ready" if `toAddress` is not set, but it's here to make TS happy. The same applies for `block` and `fees`.
    const disableSend =
      !signer ||
      status !== "ready" ||
      !toAddress ||
      !block ||
      !fees ||
      !tokenInfo ||
      !selectedRoute;

    if (disableSend) {
      return;
    }

    try {
      const tx = sendAcrossDeposit(signer, {
        toAddress,
        amount,
        tokenAddress: selectedRoute.fromTokenAddress,
        fromChain: selectedRoute.fromChain,
        toChain: selectedRoute.toChain,
        isNative: selectedRoute.isNative,
        relayerFeePct: fees.relayerFee.pct,
        timestamp: (await hubPool.getCurrentTime()).sub(QUOTE_TIMESTAMP_BUFFER),
        referrer,
      });
      // matomo track bridge
      trackEvent({
        category: "send",
        action: "bridge",
        name: JSON.stringify({
          symbol: selectedRoute.fromTokenSymbol,
          from: selectedRoute.fromChain,
          to: selectedRoute.toChain,
        }),
        value: Number(formatUnits(amount, tokenInfo.decimals)),
      });
      return tx;
    } catch (e) {
      console.error(e);
      console.error("Something went wrong when depositing.");
    }
  };

  const approve = async () => {
    // NOTE: Since status will only be "ready" if `hasToSwitchChain` is false, we don't need to check that the `signer` has the same `chainId` as `fromChain`.
    if (!signer || status !== "ready" || !selectedRoute) {
      return;
    }
    return sendAcrossApproval(signer, {
      tokenAddress: selectedRoute.fromTokenAddress,
      amount: MAX_APPROVAL_AMOUNT,
      chainId: selectedRoute.fromChain,
    });
  };

  return {
    fromChain,
    toChain,
    toAddress,
    amount,
    tokenSymbol,
    error,
    hasToApprove,
    hasToSwitchChain,
    fees,
    status,
    send,
    approve,
  };
}

type Fees = {
  isLiquidityInsufficient: boolean;
  isAmountTooLow: boolean;
};
type ComputeStatusArgs = {
  tokenSymbol?: string;
  amount: ethers.BigNumber;
  formStatus: FormStatus;
  hasToSwitchChain: boolean;
  balance: ethers.BigNumber | undefined;
  fromChain?: ChainId;
  fees: Fees | undefined;
};
/**
 * Computes the current send tab status.
 * @param computeStatusArgs {@link ComputeStatusArgs arguments} object to compute the status from.
 * @returns The current send tab status, and an error if any.
 */

function computeStatus({
  formStatus,
  hasToSwitchChain,
  amount,
  balance,
  fees,
  tokenSymbol,
  fromChain,
}: ComputeStatusArgs): { status: SendStatus; error?: SendError } {
  const config = getConfig();
  if (!tokenSymbol) {
    return { status: SendStatus.IDLE };
  }
  if (!fromChain) {
    return { status: SendStatus.IDLE };
  }
  if (formStatus !== FormStatus.VALID) {
    return { status: SendStatus.IDLE };
  }
  if (hasToSwitchChain) {
    return {
      status: SendStatus.ERROR,
      error: new WrongNetworkError(fromChain),
    };
  }
  const { isNative, decimals } = config.getTokenInfoBySymbol(
    fromChain,
    tokenSymbol
  );
  if (balance) {
    const adjustedBalance = isNative
      ? balance.sub(parseUnits(FEE_ESTIMATION, decimals))
      : balance;
    if (adjustedBalance.lt(amount)) {
      return {
        status: SendStatus.ERROR,
        error: new InsufficientBalanceError(),
      };
    }
  }
  if (fees) {
    if (fees.isLiquidityInsufficient) {
      return {
        status: SendStatus.ERROR,
        error: new InsufficientLiquidityError(tokenSymbol),
      };
    }
    if (fees.isAmountTooLow) {
      return { status: SendStatus.ERROR, error: new FeeTooHighError() };
    }
  }
  if (!balance || !fees) {
    return { status: SendStatus.VALIDATING };
  }
  return { status: SendStatus.READY };
}
