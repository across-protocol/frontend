import { useMemo } from "react";
import { BigNumber } from "ethers";

import { AmountInputError, validationErrorTextMap } from "../utils/validation";
import { EnrichedToken } from "../components/ChainTokenSelector/ChainTokenSelectorModal";
import { useTokenBalance } from "./useTokenBalance";

export type ValidationResult = {
  error?: AmountInputError;
  warn?: AmountInputError;
  errorFormatted?: string;
};

export function useValidateSwapAndBridge(
  amount: BigNumber | null,
  isAmountOrigin: boolean,
  inputToken: EnrichedToken | null,
  outputToken: EnrichedToken | null,
  isConnected: boolean,
  swapQuoteInputAmount: BigNumber | undefined
): ValidationResult {
  // use up-to-date balances
  const inputTokenBalance = useTokenBalance(inputToken);

  const validation = useMemo(() => {
    let errorType: AmountInputError | undefined = undefined;

    // Only validate if wallet is connected
    if (isConnected) {
      // Check if input token is selected
      if (!inputToken) {
        errorType = AmountInputError.NO_INPUT_TOKEN_SELECTED;
      }
      // Check if output token is selected
      else if (!outputToken) {
        errorType = AmountInputError.NO_OUTPUT_TOKEN_SELECTED;
      }
      // Check if amount is entered
      else if (!amount || amount.isZero()) {
        errorType = AmountInputError.NO_AMOUNT_ENTERED;
      }
      // invalid amount
      else if (amount.lte(0)) {
        errorType = AmountInputError.INVALID;
      }
      // balance check for origin-side inputs
      else if (isAmountOrigin && inputTokenBalance) {
        if (amount.gt(inputTokenBalance)) {
          errorType = AmountInputError.INSUFFICIENT_BALANCE;
        }
      } else if (!isAmountOrigin && swapQuoteInputAmount && inputTokenBalance) {
        if (swapQuoteInputAmount?.gt(inputTokenBalance)) {
          errorType = AmountInputError.INSUFFICIENT_BALANCE;
        }
      }
    }
    return {
      error: errorType,
      warn: undefined as AmountInputError | undefined,
      errorFormatted: getValidationErrorText({
        validationError: errorType,
        inputToken,
        outputToken,
      }),
    };
  }, [
    isConnected,
    inputToken,
    outputToken,
    amount,
    isAmountOrigin,
    inputTokenBalance,
    swapQuoteInputAmount,
  ]);

  return validation;
}

function getValidationErrorText(props: {
  validationError?: AmountInputError;
  inputToken: EnrichedToken | null;
  outputToken: EnrichedToken | null;
}): string | undefined {
  if (!props.validationError) {
    return;
  }
  return validationErrorTextMap[props.validationError]?.replace(
    "[INPUT_TOKEN]",
    props.inputToken?.symbol ?? ""
  );
}
