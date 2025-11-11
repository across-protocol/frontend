import {
  executeStrategies,
  selectBestCrossSwapQuote,
} from "../../../api/_dexes/cross-swap-service";
import {
  SwapQuoteUnavailableError,
  InvalidParamError,
  AcrossErrorCode,
} from "../../../api/_errors";
import { BigNumber } from "ethers";

// format the following
jest.mock("../../../api/_utils", () => ({
  getBridgeQuoteForMinOutput: jest.fn(),
  getRouteByInputTokenAndDestinationChain: jest.fn(),
  getRouteByOutputTokenAndOriginChain: jest.fn(),
  getRoutesByChainIds: jest.fn(),
  getTokenByAddress: jest.fn(),
  getBridgeQuoteForExactInput: jest.fn(),
  addTimeoutToPromise: jest.fn((promise) => promise),
  getRejectedReasons: jest.fn(),
  getLogger: jest.fn(() => ({ debug: jest.fn() })),
}));

jest.mock("../../../api/_dexes/utils", () => ({
  buildExactInputBridgeTokenMessage: jest.fn(),
  buildExactOutputBridgeTokenMessage: jest.fn(),
  buildMinOutputBridgeTokenMessage: jest.fn(),
  getCrossSwapTypes: jest.fn(),
  getPreferredBridgeTokens: jest.fn(),
  getQuoteFetchStrategies: jest.fn(),
  defaultQuoteFetchStrategies: {},
  AMOUNT_TYPE: {
    EXACT_INPUT: "exactInput",
    EXACT_OUTPUT: "exactOutput",
    MIN_OUTPUT: "minOutput",
  },
  CROSS_SWAP_TYPE: {
    BRIDGEABLE_TO_BRIDGEABLE: "bridgeableTobridgeable",
    BRIDGEABLE_TO_ANY: "bridgeableToAny",
    ANY_TO_BRIDGEABLE: "anyToBridgeable",
    ANY_TO_ANY: "anyToAny",
  },
  buildDestinationSwapCrossChainMessage: jest.fn(),
  assertMinOutputAmount: jest.fn(),
}));

jest.mock("../../../api/_multicall-handler", () => ({
  getMultiCallHandlerAddress: jest.fn(),
}));

describe("#executeStrategies()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("equal-speed mode", () => {
    const equalSpeedMode = { mode: "equal-speed" as const };

    it("should return the first successful result when all promises succeed", async () => {
      const results = [
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 1, data: "first" }), 10)
          ),
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 2, data: "second" }), 20)
          ),
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 3, data: "third" }), 30)
          ),
      ];

      const result = await executeStrategies(results, equalSpeedMode);

      // Should return one of the results (first to resolve)
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          data: "first",
        })
      );
    });

    it("should return first successful result when some promises fail", async () => {
      const results = [
        () => Promise.reject(new Error("First failed")),
        () => Promise.resolve({ id: 2, data: "success" }),
        () => Promise.reject(new Error("Third failed")),
      ];

      const result = await executeStrategies(results, equalSpeedMode);
      expect(result).toEqual({ id: 2, data: "success" });
    });

    it("should throw SwapQuoteUnavailableError when all promises fail with it", async () => {
      const results = [
        () =>
          Promise.reject(
            new SwapQuoteUnavailableError({
              message: "No quotes available",
              code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
            })
          ),
        () =>
          Promise.reject(
            new SwapQuoteUnavailableError({
              message: "Also no quotes",
              code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
            })
          ),
      ];

      await expect(executeStrategies(results, equalSpeedMode)).rejects.toThrow(
        SwapQuoteUnavailableError
      );
    });

    it("should throw InvalidParamError when all promises fail with excludeSources/includeSources errors", async () => {
      const invalidParamError1 = new InvalidParamError({
        message: "Invalid excludeSources",
        param: "excludeSources",
      });
      const invalidParamError2 = new InvalidParamError({
        message: "Invalid includeSources",
        param: "includeSources",
      });

      const results = [
        () => Promise.reject(invalidParamError1),
        () => Promise.reject(invalidParamError2),
      ];

      await expect(executeStrategies(results, equalSpeedMode)).rejects.toThrow(
        InvalidParamError
      );
    });

    it("should prioritize SwapQuoteUnavailableError over other errors", async () => {
      const results = [
        () =>
          Promise.reject(
            new SwapQuoteUnavailableError({
              message: "No quotes available",
              code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
            })
          ),
        () => Promise.reject(new Error("Some other error")),
        () => Promise.reject(new Error("Another error")),
      ];

      await expect(executeStrategies(results, equalSpeedMode)).rejects.toThrow(
        SwapQuoteUnavailableError
      );
    });

    it("should throw generic error when no specific error patterns match", async () => {
      const results = [
        () => Promise.reject(new Error("Generic error")),
        () => Promise.reject(new Error("Another generic error")),
      ];

      await expect(
        executeStrategies(results, equalSpeedMode)
      ).rejects.toThrow();
    });
  });

  describe("priority-speed mode", () => {
    it("should return result from first chunk when it succeeds", async () => {
      const priorityMode = {
        mode: "priority-speed" as const,
        priorityChunkSize: 2,
      };

      const results = [
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 1, data: "first-chunk-1" }), 10)
          ),
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 2, data: "first-chunk-2" }), 20)
          ),
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 3, data: "second-chunk-1" }), 30)
          ),
      ];

      const result = await executeStrategies(results, priorityMode);

      // Should return result from first chunk
      expect(result).toEqual({ id: 1, data: "first-chunk-1" });
    });

    it("should move to next chunk when first chunk fails completely", async () => {
      const priorityMode = {
        mode: "priority-speed" as const,
        priorityChunkSize: 1,
      };

      const results = [
        () => Promise.reject(new Error("First chunk failed 1")),
        () => Promise.reject(new Error("First chunk failed 2")),
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ id: 3, data: "second-chunk-success" }),
              20
            )
          ),
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ id: 4, data: "second-chunk-success-2" }),
              10
            )
          ),
      ];

      const result = await executeStrategies(results, priorityMode);
      expect(result).toEqual({ id: 4, data: "second-chunk-success-2" });
    });

    it("should handle chunks correctly when priority chunk size is larger than array", async () => {
      const priorityMode = {
        mode: "priority-speed" as const,
        priorityChunkSize: 10,
      };

      const results = [
        () => Promise.resolve({ id: 1, data: "success" }),
        () => Promise.resolve({ id: 2, data: "success2" }),
      ];

      const result = await executeStrategies(results, priorityMode);
      expect([1, 2]).toContain(result.id);
    });

    it("should process multiple chunks in sequence", async () => {
      const priorityMode = {
        mode: "priority-speed" as const,
        priorityChunkSize: 1,
      };

      const results = [
        () => Promise.reject(new Error("Chunk 1 failed")),
        () => Promise.reject(new Error("Chunk 2 failed")),
        () => Promise.resolve({ id: 3, data: "chunk-3-success" }),
      ];

      const result = await executeStrategies(results, priorityMode);
      expect(result).toEqual({ id: 3, data: "chunk-3-success" });
    });

    it("should aggregate errors correctly when all chunks fail", async () => {
      const priorityMode = {
        mode: "priority-speed" as const,
        priorityChunkSize: 1,
      };

      const results = [
        () => Promise.reject(new Error("First error")),
        () =>
          Promise.reject(
            new SwapQuoteUnavailableError({
              message: "No quotes available",
              code: AcrossErrorCode.SWAP_QUOTE_UNAVAILABLE,
            })
          ),
        () => Promise.reject(new Error("Third error")),
      ];

      await expect(executeStrategies(results, priorityMode)).rejects.toThrow(
        SwapQuoteUnavailableError
      );
    });

    it("should handle mixed error types in priority mode", async () => {
      const priorityMode = {
        mode: "priority-speed" as const,
        priorityChunkSize: 2,
      };

      const results = [
        () =>
          Promise.reject(
            new InvalidParamError({
              message: "Invalid sources",
              param: "excludeSources",
            })
          ),
        () =>
          Promise.reject(
            new InvalidParamError({
              message: "Invalid",
              param: "includeSources",
            })
          ),
      ];

      await expect(executeStrategies(results, priorityMode)).rejects.toThrow(
        InvalidParamError
      );
    });
  });
});

describe("#selectBestCrossSwapQuote() - origin swap preference", () => {
  const mockToken = {
    address: "0x1234567890123456789012345678901234567890",
    symbol: "TEST",
    decimals: 18,
    chainId: 1,
  };

  const mockFees = {
    totalRelay: {
      pct: BigNumber.from("1"),
      total: BigNumber.from("1000"),
      token: mockToken,
    },
    relayerCapital: {
      pct: BigNumber.from("5"),
      total: BigNumber.from("500"),
      token: mockToken,
    },
    relayerGas: {
      pct: BigNumber.from("3"),
      total: BigNumber.from("300"),
      token: mockToken,
    },
    lp: {
      pct: BigNumber.from("2"),
      total: BigNumber.from("200"),
      token: mockToken,
    },
    bridgeFee: {
      pct: BigNumber.from("1"),
      total: BigNumber.from("100"),
      token: mockToken,
    },
  };

  const createQuote = (
    hasOrigin: boolean,
    hasDestination: boolean,
    amount: string
  ) => {
    const quote = {
      crossSwap: {
        type: "exactInput" as const,
        inputToken: mockToken,
        outputToken: mockToken,
        inputAmount: BigNumber.from("1000000"),
        depositor: "0x1234567890123456789012345678901234567890",
        recipient: "0x1234567890123456789012345678901234567890",
        originChainId: 1,
        destinationChainId: 10,
        amount: BigNumber.from("1000000"),
        slippageTolerance: "auto" as const,
        refundOnOrigin: false,
        embeddedActions: [],
        strictTradeType: false,
      },
      bridgeQuote: {
        provider: "across" as const,
        inputAmount: BigNumber.from("1000000"),
        outputAmount: BigNumber.from(amount),
        minOutputAmount: BigNumber.from("900000"),
        estimatedFillTimeSec: 60,
        fees: mockFees,
        suggestedFees: {},
        inputToken: mockToken,
        outputToken: mockToken,
      },
      originSwapQuote: hasOrigin
        ? {
            expectedAmountOut: BigNumber.from(amount),
            expectedAmountIn: BigNumber.from("1000000"),
          }
        : undefined,
      destinationSwapQuote: hasDestination
        ? {
            expectedAmountOut: BigNumber.from(amount),
            expectedAmountIn: BigNumber.from("950000"),
          }
        : undefined,
      contracts: {
        depositEntryPoint: { name: "SpokePool" as const, address: "0x1" },
      },
    };
    return quote as any;
  };

  it("should prefer A2B when within 90% threshold of B2A", async () => {
    const a2b = createQuote(true, false, "920000"); // 92% of B2A
    const b2a = createQuote(false, true, "1000000");

    const result = await selectBestCrossSwapQuote(
      [Promise.resolve(a2b), Promise.resolve(b2a)],
      a2b.crossSwap
    );

    expect(result.originSwapQuote).toBeDefined();
    expect(result.destinationSwapQuote).toBeUndefined();
  });

  it("should choose B2A when beyond 90% threshold", async () => {
    const a2b = createQuote(true, false, "850000"); // 85% of B2A
    const b2a = createQuote(false, true, "1000000");

    const result = await selectBestCrossSwapQuote(
      [Promise.resolve(a2b), Promise.resolve(b2a)],
      a2b.crossSwap
    );

    expect(result.destinationSwapQuote).toBeDefined();
    expect(result.originSwapQuote).toBeUndefined();
  });
});
