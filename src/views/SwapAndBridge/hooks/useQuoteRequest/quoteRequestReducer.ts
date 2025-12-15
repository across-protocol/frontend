import { QuoteRequest, QuoteRequestAction } from "./quoteRequestAction";

export const quoteRequestReducer = (
  prevState: QuoteRequest,
  action: QuoteRequestAction
): QuoteRequest => {
  switch (action.type) {
    case "SET_ORIGIN_TOKEN":
      return {
        ...prevState,
        originToken: action.payload,
        userInputValue: "",
        userInputAmount: null,
        quoteOutputAmount: null,
      };
    case "SET_DESTINATION_TOKEN":
      return {
        ...prevState,
        destinationToken: action.payload,
        userInputValue: "",
        userInputAmount: null,
        quoteOutputAmount: null,
      };
    case "SET_USER_INPUT":
      return {
        ...prevState,
        userInputField: action.payload.field,
        userInputValue: action.payload.value,
        userInputAmount: action.payload.amount,
      };
    case "SET_QUOTE_OUTPUT":
      return {
        ...prevState,
        quoteOutputAmount: action.payload,
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
        userInputField:
          prevState.userInputField === "origin" ? "destination" : "origin",
      };
    default:
      return prevState;
  }
};
