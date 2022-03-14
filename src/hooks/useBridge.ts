import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { FormStatus, useSendForm } from "./useSendForm";
import { useBalance } from "./useBalance";
import { useBridgeFees } from "./useBridgeFees";
import { useAllowance } from "./useAllowance";
import { useConnection } from "state/hooks";
import { useBlock } from "./useBlock";
import {
  getDepositBox,
  TOKENS_LIST,
  FEE_ESTIMATION,
  ETH_ADDRESS,
  InsufficientBalanceError,
  FeeTooHighError,
  InsufficientLiquidityError,
  getRoute,
  MAX_APPROVAL_AMOUNT,
  WrongNetworkError,
} from "utils";

type SendStatus = "idle" | "validating" | "ready" | "error";
type SendError =
  | InsufficientBalanceError
  | FeeTooHighError
  | InsufficientLiquidityError
  | WrongNetworkError;

export function useBridge() {
  const { referrer } = useQueryParams();
  const { chainId, account, signer } = useConnection();
  const {
    amount,
    fromChain,
    toChain,
    token,
    toAddress,
    status: formStatus,
  } = useSendForm();

  const { block } = useBlock(fromChain);
  const { balance } = useBalance(token, fromChain, account);
  const depositBox = getDepositBox(fromChain);
  const { allowance } = useAllowance(
    token,
    chainId,
    account,
    depositBox.address,
    block?.number
  );
  const tokenSymbol = TOKENS_LIST[fromChain].find(
    (t) => t.address === token
  )?.symbol;
  const { fees } = useBridgeFees(amount, fromChain, tokenSymbol);
  const hasToSwitchChain = chainId !== fromChain;
  let { status, error } = computeStatus({
    token,
    amount,
    formStatus,
    hasToSwitchChain,
    balance,
    fees,
  });

  const hasToApprove = !!allowance && amount.lte(allowance);

  const route = getRoute(fromChain, toChain);

  const send = async () => {
    // NOTE: the `toAddress` check is redundant, as status won't be "ready" if `toAddress` is not set, but it's here to make TS happy. The same applies for `block` and `fees`.
    if (!signer || status !== "ready" || !toAddress || !block || !fees) {
      return;
    }
    return route.deposit(signer, {
      toAddress,
      amount,
      token,
      fromChain,
      timestamp: block.timestamp,
      slowRelayFeePct: fees.instantRelayFee.pct,
      instantRelayFeePct: fees.instantRelayFee.pct,
      referrer,
    });
  };

  const approve = async () => {
    // NOTE: Since status will only be "ready" if `hasToSwitchChain` is false, we don't need to check that the `signer` has the same `chainId` as `fromChain`.
    if (!signer || status !== "ready") {
      return;
    }
    return route.approve(signer, {
      token,
      amount: MAX_APPROVAL_AMOUNT,
      chainId: fromChain,
    });
  };

  return {
    fromChain,
    toChain,
    toAddress,
    amount,
    token,
    error,
    hasToApprove,
    hasToSwitchChain,
    fees,
    status,
    send,
    approve,
  };
}

type ComputeStatusArgs = {
  token: string;
  amount: ethers.BigNumber;
  formStatus: FormStatus;
  hasToSwitchChain: boolean;
  balance: ethers.BigNumber | undefined;
  fees:
  | {
    isLiquidityInsufficient: boolean;
    isAmountTooLow: boolean;
  }
  | undefined;
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
  token,
}: ComputeStatusArgs): { status: SendStatus; error?: SendError } {
  if (formStatus !== "valid") {
    return { status: "idle" };
  }
  if (hasToSwitchChain) {
    return { status: "error", error: new WrongNetworkError() };
  }
  if (balance) {
    const adjustedBalance =
      token === ETH_ADDRESS
        ? balance.sub(ethers.utils.parseEther(FEE_ESTIMATION))
        : balance;
    if (adjustedBalance.lt(amount)) {
      return { status: "error", error: new InsufficientBalanceError() };
    }
  }
  if (fees) {
    if (fees.isLiquidityInsufficient) {
      return { status: "error", error: new InsufficientLiquidityError(token) };
    }
    if (fees.isAmountTooLow) {
      return { status: "error", error: new FeeTooHighError() };
    }
  }
  if (!balance || !fees) {
    return { status: "validating" };
  }
  return { status: "ready" };
}
