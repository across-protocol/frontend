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
    case "SET_DESTINATION_ACCOUNT":
      return { ...prevState, destinationAccount: action.payload };
    case "SET_ORIGIN_ACCOUNT":
      return { ...prevState, originAccount: action.payload };
    case "QUICK_SWAP":
      return {
        ...prevState,
        originToken: prevState.destinationToken,
        destinationToken: prevState.originToken,
        tradeType:
          prevState.tradeType === "exactInput"
            ? "minOutput"
            : prevState.tradeType === "minOutput"
              ? "minOutput"
              : "exactInput",
      };
    default:
      return prevState;
  }
};
