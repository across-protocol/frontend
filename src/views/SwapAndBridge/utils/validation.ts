export enum AmountInputError {
  INVALID = "invalid",
  PAUSED_DEPOSITS = "pausedDeposits",
  INSUFFICIENT_LIQUIDITY = "insufficientLiquidity",
  INSUFFICIENT_BALANCE = "insufficientBalance",
  AMOUNT_TOO_LOW = "amountTooLow",
  PRICE_IMPACT_TOO_HIGH = "priceImpactTooHigh",
  SWAP_QUOTE_UNAVAILABLE = "swapQuoteUnavailable",
  NO_INPUT_TOKEN_SELECTED = "noInputTokenSelected",
  NO_OUTPUT_TOKEN_SELECTED = "noOutputTokenSelected",
  NO_AMOUNT_ENTERED = "noAmountEntered",
}

export const validationErrorTextMap: Record<AmountInputError, string> = {
  [AmountInputError.INSUFFICIENT_BALANCE]:
    "Not enough [INPUT_TOKEN] to process this transfer.",
  [AmountInputError.PAUSED_DEPOSITS]:
    "[INPUT_TOKEN] deposits are temporarily paused.",
  [AmountInputError.INSUFFICIENT_LIQUIDITY]:
    "Input amount exceeds limits set to maintain optimal service for all users. Decrease amount to [MAX_DEPOSIT] or lower.",
  [AmountInputError.INVALID]: "Only positive numbers are allowed as an input.",
  [AmountInputError.AMOUNT_TOO_LOW]:
    "The amount you are trying to bridge is too low.",
  [AmountInputError.PRICE_IMPACT_TOO_HIGH]:
    "Price impact is too high. Check back later when liquidity is restored.",
  [AmountInputError.SWAP_QUOTE_UNAVAILABLE]:
    "Swap quote temporarily unavailable. Please try again later.",
  [AmountInputError.NO_INPUT_TOKEN_SELECTED]:
    "Select an input token to continue",
  [AmountInputError.NO_OUTPUT_TOKEN_SELECTED]:
    "Select an output token to continue",
  [AmountInputError.NO_AMOUNT_ENTERED]: "Enter an amount to continue",
};
