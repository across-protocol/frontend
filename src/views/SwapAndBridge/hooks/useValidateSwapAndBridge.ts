import { useMemo } from "react";
import { BigNumber } from "ethers";

import { AmountInputError } from "../../Bridge/utils";
import { validationErrorTextMap } from "views/Bridge/components/AmountInput";
import { TokenWithBalance } from "./useSwapAndBridgeTokens";

export type ValidationResult = {
  error?: AmountInputError;
  warn?: AmountInputError;
  errorFormatted?: string;
};

export function useValidateSwapAndBridge(
  amount: BigNumber | null,
  isAmountOrigin: boolean,
  inputToken: TokenWithBalance | null,
  outputToken: TokenWithBalance | null,
  isConnected: boolean,
  swapQuoteInputAmount: BigNumber | undefined
): ValidationResult {
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
      else if (isAmountOrigin && inputToken?.balance) {
        if (amount.gt(inputToken.balance)) {
          errorType = AmountInputError.INSUFFICIENT_BALANCE;
        }
      } else if (!isAmountOrigin && swapQuoteInputAmount) {
        if (swapQuoteInputAmount?.gt(inputToken.balance)) {
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
    swapQuoteInputAmount,
  ]);

  return validation;
}

function getValidationErrorText(props: {
  validationError?: AmountInputError;
  inputToken: TokenWithBalance | null;
  outputToken: TokenWithBalance | null;
}): string | undefined {
  if (!props.validationError) {
    return;
  }
  return validationErrorTextMap[props.validationError]?.replace(
    "[INPUT_TOKEN]",
    props.inputToken?.symbol ?? ""
  );
}
