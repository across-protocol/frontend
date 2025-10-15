import { useMemo } from "react";
import { BigNumber } from "ethers";
import axios from "axios";

import { AmountInputError } from "../../Bridge/utils";
import { EnrichedToken } from "../components/ChainTokenSelector/Modal";
import { validationErrorTextMap } from "views/Bridge/components/AmountInput";

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
  error: any
): ValidationResult {
  const validation = useMemo(() => {
    let errorType: AmountInputError | undefined = undefined;

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
      errorFormatted: getValidationErrorText({
        validationError: errorType,
        inputToken,
        outputToken,
      }),
    };
  }, [amount, isAmountOrigin, inputToken, outputToken, error]);

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
