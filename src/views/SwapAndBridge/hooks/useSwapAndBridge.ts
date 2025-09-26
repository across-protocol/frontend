import { useCallback, useMemo, useState } from "react";
import { BigNumber } from "ethers";
import axios from "axios";

import { AmountInputError } from "../../Bridge/utils";
import useSwapQuote from "./useSwapQuote";
import { EnrichedTokenSelect } from "../components/ChainTokenSelector/SelectorButton";
import {
  useSwapApprovalAction,
  SwapApprovalData,
} from "./useSwapApprovalAction";

export type UseSwapAndBridgeReturn = {
  inputToken: EnrichedTokenSelect | null;
  outputToken: EnrichedTokenSelect | null;
  setInputToken: (t: EnrichedTokenSelect | null) => void;
  setOutputToken: (t: EnrichedTokenSelect | null) => void;
  quickSwap: () => void;

  amount: BigNumber | null;
  setAmount: (a: BigNumber | null) => void;
  isAmountOrigin: boolean;
  setIsAmountOrigin: (v: boolean) => void;

  swapQuote: ReturnType<typeof useSwapQuote>["data"];
  isQuoteLoading: boolean;
  expectedInputAmount?: string;
  expectedOutputAmount?: string;

  validationError?: AmountInputError;
  validationWarning?: AmountInputError;

  isConnected: boolean;
  isWrongNetwork: boolean;
  isSubmitting: boolean;
  buttonDisabled: boolean;
  onConfirm: () => Promise<string>;
};

export function useSwapAndBridge(): UseSwapAndBridgeReturn {
  const [inputToken, setInputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [outputToken, setOutputToken] = useState<EnrichedTokenSelect | null>(
    null
  );
  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [isAmountOrigin, setIsAmountOrigin] = useState<boolean>(true);

  const quickSwap = useCallback(() => {
    setInputToken((prevInput) => {
      const prevOut = outputToken;
      setOutputToken(prevInput || null);
      return prevOut || null;
    });
    setAmount(null);
  }, [outputToken]);

  const {
    data: swapQuote,
    isLoading: isQuoteLoading,
    error,
  } = useSwapQuote({
    origin: inputToken ? inputToken : null,
    destination: outputToken ? outputToken : null,
    amount: amount,
    isInputAmount: isAmountOrigin,
  });

  const approvalData: SwapApprovalData | undefined = useMemo(() => {
    if (!swapQuote) return undefined;
    return {
      approvalTxns: swapQuote.approvalTxns,
      swapTx: swapQuote.swapTx as any,
    };
  }, [swapQuote]);

  const approvalAction = useSwapApprovalAction(
    inputToken?.chainId || 0,
    approvalData
  );

  const validation = useMemo(() => {
    let errorType: AmountInputError | undefined = undefined;
    // invalid or empty amount
    if (!amount || amount.lte(0)) {
      errorType = AmountInputError.INVALID;
    }
    // balance check for origin-side inputs
    if (!errorType && isAmountOrigin && inputToken?.balance) {
      if (amount && amount.gt(inputToken.balance)) {
        errorType = AmountInputError.INSUFFICIENT_BALANCE;
      }
    }
    // backend availability
    if (!errorType && error && axios.isAxiosError(error)) {
      const code = (error.response?.data as any)?.code as string | undefined;
      if (code === "AMOUNT_TOO_LOW") {
        errorType = AmountInputError.AMOUNT_TOO_LOW;
      } else if (code === "SWAP_QUOTE_UNAVAILABLE") {
        errorType = AmountInputError.SWAP_QUOTE_UNAVAILABLE;
      }
    }
    return {
      error: errorType,
      warn: undefined as AmountInputError | undefined,
    };
  }, [amount, isAmountOrigin, inputToken, error]);

  const expectedInputAmount = useMemo(() => {
    return swapQuote?.inputAmount?.toString();
  }, [swapQuote]);

  const expectedOutputAmount = useMemo(() => {
    return swapQuote?.expectedOutputAmount?.toString();
  }, [swapQuote]);

  const onConfirm = useCallback(async () => {
    const txHash = await approvalAction.buttonActionHandler();
    return txHash as string;
  }, [approvalAction]);

  return {
    inputToken,
    outputToken,
    setInputToken,
    setOutputToken,
    quickSwap,

    amount,
    setAmount,
    isAmountOrigin,
    setIsAmountOrigin,

    swapQuote,
    isQuoteLoading,
    expectedInputAmount,
    expectedOutputAmount,

    validationError: validation.error,
    validationWarning: validation.warn,

    isConnected: approvalAction.isConnected,
    isWrongNetwork: approvalAction.isWrongNetwork,
    isSubmitting: approvalAction.isButtonActionLoading,
    buttonDisabled:
      approvalAction.buttonDisabled ||
      !!validation.error ||
      !inputToken ||
      !outputToken ||
      !amount ||
      amount.lte(0),
    onConfirm,
  };
}

export default useSwapAndBridge;
