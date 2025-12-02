import { QuoteRequest } from "./quoteRequestAction";

// Placeholder addresses for quote simulation when wallet is not connected
export const PLACEHOLDER_EVM_ADDRESS =
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D";
export const PLACEHOLDER_SVM_ADDRESS =
  "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";

export const initialQuote: QuoteRequest = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  originAccount: { accountType: "evm", address: PLACEHOLDER_EVM_ADDRESS },
  destinationAccount: { accountType: "evm", address: PLACEHOLDER_EVM_ADDRESS },
  amount: null,
};
