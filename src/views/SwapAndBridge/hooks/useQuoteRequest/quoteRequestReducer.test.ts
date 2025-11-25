import { BigNumber } from "ethers";
import { quoteRequestReducer } from "./quoteRequestReducer";
import { QuoteRequest } from "./quoteRequestAction";

const initialState: QuoteRequest = {
  tradeType: "exactInput",
  originToken: null,
  destinationToken: null,
  originAccount: null,
  destinationAccount: null,
  amount: null,
};

const mockToken = (symbol: string) =>
  ({ symbol, chainId: 1, address: "0x" }) as QuoteRequest["originToken"];

const mockAccount = (address: string) =>
  ({ accountType: "evm", address }) as QuoteRequest["originAccount"];

describe("quoteRequestReducer", () => {
  it("sets origin token", () => {
    const token = mockToken("ETH");
    const result = quoteRequestReducer(initialState, {
      type: "SET_ORIGIN_TOKEN",
      payload: token,
    });
    expect(result.originToken).toBe(token);
  });

  it("sets destination token", () => {
    const token = mockToken("USDC");
    const result = quoteRequestReducer(initialState, {
      type: "SET_DESTINATION_TOKEN",
      payload: token,
    });
    expect(result.destinationToken).toBe(token);
  });

  it("sets origin amount with exactInput trade type", () => {
    const amount = BigNumber.from(100);
    const result = quoteRequestReducer(initialState, {
      type: "SET_ORIGIN_AMOUNT",
      payload: amount,
    });
    expect(result.amount).toBe(amount);
    expect(result.tradeType).toBe("exactInput");
  });

  it("sets destination amount with minOutput trade type", () => {
    const amount = BigNumber.from(100);
    const result = quoteRequestReducer(initialState, {
      type: "SET_DESTINATION_AMOUNT",
      payload: amount,
    });
    expect(result.amount).toBe(amount);
    expect(result.tradeType).toBe("minOutput");
  });

  it("sets origin account", () => {
    const account = mockAccount("0xabc");
    const result = quoteRequestReducer(initialState, {
      type: "SET_ORIGIN_ACCOUNT",
      payload: account,
    });
    expect(result.originAccount).toBe(account);
  });

  it("sets destination account", () => {
    const account = mockAccount("0xdef");
    const result = quoteRequestReducer(initialState, {
      type: "SET_DESTINATION_ACCOUNT",
      payload: account,
    });
    expect(result.destinationAccount).toBe(account);
  });

  describe("QUICK_SWAP", () => {
    it("swaps origin and destination tokens", () => {
      const eth = mockToken("ETH");
      const usdc = mockToken("USDC");
      const state: QuoteRequest = {
        ...initialState,
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

    it("converts exactInput to minOutput", () => {
      const state: QuoteRequest = { ...initialState, tradeType: "exactInput" };
      const result = quoteRequestReducer(state, {
        type: "QUICK_SWAP",
        payload: undefined,
      });
      expect(result.tradeType).toBe("minOutput");
    });

    it("converts minOutput to exactInput", () => {
      const state: QuoteRequest = { ...initialState, tradeType: "minOutput" };
      const result = quoteRequestReducer(state, {
        type: "QUICK_SWAP",
        payload: undefined,
      });
      expect(result.tradeType).toBe("exactInput");
    });
  });

  it("returns previous state for unknown action", () => {
    const result = quoteRequestReducer(initialState, {
      type: "UNKNOWN" as never,
      payload: undefined,
    });
    expect(result).toBe(initialState);
  });
});
