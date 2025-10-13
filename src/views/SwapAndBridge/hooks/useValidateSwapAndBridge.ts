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
  error: any
): ValidationResult {
  const validation = useMemo(() => {
    let errorType: AmountInputError | undefined = undefined;
    // invalid amount (allow empty/no amount without error)
    if (amount && amount.lte(0)) {
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
      errorFormatted: getValidationErrorText({
        validationError: errorType,
        inputToken,
      }),
    };
  }, [amount, isAmountOrigin, inputToken, error]);

  return validation;
}

function getValidationErrorText(props: {
  validationError?: AmountInputError;
  inputToken: EnrichedToken | null;
}): string | undefined {
  if (!props.validationError) {
    return;
  }
  return validationErrorTextMap[props.validationError]?.replace(
    "[INPUT_TOKEN]",
    props.inputToken!.symbol
  );
}
