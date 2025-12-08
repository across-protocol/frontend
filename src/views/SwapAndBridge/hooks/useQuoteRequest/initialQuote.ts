import { QuoteRequest } from "./quoteRequestAction";

export const initialQuote: QuoteRequest = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  customDestinationAccount: null,
  amount: null,
};
