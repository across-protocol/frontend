import { QuoteRequest, QuoteRequestAction } from "./quoteRequestAction";

export const quoteRequestReducer = (
  prevState: QuoteRequest,
  action: QuoteRequestAction
): QuoteRequest => {
  switch (action.type) {
    case "SET_ORIGIN_TOKEN":
      return { ...prevState, originToken: action.payload };
    case "SET_DESTINATION_TOKEN":
      return { ...prevState, destinationToken: action.payload };
    case "SET_DESTINATION_AMOUNT":
      return {
        ...prevState,
        amount: action.payload,
        tradeType: "minOutput",
      };
    case "SET_ORIGIN_AMOUNT":
      return {
        ...prevState,
        amount: action.payload,
        tradeType: "exactInput",
      };
    case "SET_CUSTOM_DESTINATION_ACCOUNT":
      return { ...prevState, customDestinationAccount: action.payload };
    case "RESET_CUSTOM_DESTINATION_ACCOUNT":
      return { ...prevState, customDestinationAccount: null };
    case "QUICK_SWAP":
      return {
        ...prevState,
        originToken: prevState.destinationToken,
        destinationToken: prevState.originToken,
        tradeType:
          prevState.tradeType === "exactInput" ? "minOutput" : "exactInput",
      };
    default:
      return prevState;
  }
};
