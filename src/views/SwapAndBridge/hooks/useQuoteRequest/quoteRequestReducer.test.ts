import { BigNumber } from "ethers";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./quoteRequestAction";
import { initialQuote } from "./initialQuote";

const mockToken = (symbol: string) =>
  ({ symbol, chainId: 1, address: "0x" }) as QuoteRequest["originToken"];

const mockAccount = (address: string) =>
  ({ accountType: "evm", address }) as QuoteRequest["customDestinationAccount"];

describe("quoteRequestReducer", () => {
  it("sets origin token", () => {
    const token = mockToken("ETH");
    const result = quoteRequestReducer(initialQuote, {
      type: "SET_ORIGIN_TOKEN",
      payload: token,
    });
    expect(result.originToken).toBe(token);
  });

  it("sets destination token", () => {
    const token = mockToken("USDC");
    const result = quoteRequestReducer(initialQuote, {
      type: "SET_DESTINATION_TOKEN",
      payload: token,
    });
    expect(result.destinationToken).toBe(token);
  });

  it("sets user input for origin field", () => {
    const amount = BigNumber.from(100);
    const result = quoteRequestReducer(initialQuote, {
      type: "SET_USER_INPUT",
      payload: { field: "origin", value: "100", amount },
    });
    expect(result.userInputAmount).toBe(amount);
    expect(result.userInputValue).toBe("100");
    expect(result.userInputField).toBe("origin");
  });

  it("sets user input for destination field", () => {
    const amount = BigNumber.from(100);
    const result = quoteRequestReducer(initialQuote, {
      type: "SET_USER_INPUT",
      payload: { field: "destination", value: "100", amount },
    });
    expect(result.userInputAmount).toBe(amount);
    expect(result.userInputValue).toBe("100");
    expect(result.userInputField).toBe("destination");
  });

  it("sets quote output amount", () => {
    const amount = BigNumber.from(200);
    const result = quoteRequestReducer(initialQuote, {
      type: "SET_QUOTE_OUTPUT",
      payload: amount,
    });
    expect(result.quoteOutputAmount).toBe(amount);
  });

  it("sets custom destination account", () => {
    const account = mockAccount("0xdef");
    const result = quoteRequestReducer(initialQuote, {
      type: "SET_CUSTOM_DESTINATION_ACCOUNT",
      payload: account!,
    });
    expect(result.customDestinationAccount).toBe(account);
  });

  it("resets custom destination account", () => {
    const account = mockAccount("0xdef");
    const result = quoteRequestReducer(
      { ...initialQuote, customDestinationAccount: account },
      {
        type: "RESET_CUSTOM_DESTINATION_ACCOUNT",
      }
    );
    expect(result.customDestinationAccount).toBe(null);
  });

  describe("QUICK_SWAP", () => {
    it("swaps origin and destination tokens", () => {
      const eth = mockToken("ETH");
      const usdc = mockToken("USDC");
      const state: QuoteRequest = {
        ...initialQuote,
        originToken: eth,
        destinationToken: usdc,
      };

      const result = quoteRequestReducer(state, {
        type: "QUICK_SWAP",
        payload: undefined,
      });

      expect(result.originToken).toBe(usdc);
      expect(result.destinationToken).toBe(eth);
    });

    it("converts origin input field to destination", () => {
      const state: QuoteRequest = {
        ...initialQuote,
        userInputField: "origin",
      };
      const result = quoteRequestReducer(state, {
        type: "QUICK_SWAP",
        payload: undefined,
      });
      expect(result.userInputField).toBe("destination");
    });

    it("converts destination input field to origin", () => {
      const state: QuoteRequest = {
        ...initialQuote,
        userInputField: "destination",
      };
      const result = quoteRequestReducer(state, {
        type: "QUICK_SWAP",
        payload: undefined,
      });
      expect(result.userInputField).toBe("origin");
    });
  });

  it("returns previous state for unknown action", () => {
    const result = quoteRequestReducer(initialQuote, {
      type: "UNKNOWN" as never,
      payload: undefined,
    });
    expect(result).toBe(initialQuote);
  });
});
