import { QuoteRequest } from "./quoteRequestAction";

export const initialQuote: QuoteRequest = {
  originToken: null,
  destinationToken: null,
  customDestinationAccount: null,
  userInputField: "origin",
  userInputAmount: null,
  quoteOutputAmount: null,
};
