import { executeStrategies } from "../../../api/_dexes/cross-swap-service";
import {
  SwapQuoteUnavailableError,
  InvalidParamError,
  AcrossErrorCode,
} from "../../../api/_errors";

// format the following
jest.mock("../../../api/_utils", () => ({
  getBridgeQuoteForMinOutput: jest.fn(),
  getRouteByInputTokenAndDestinationChain: jest.fn(),
  getRouteByOutputTokenAndOriginChain: jest.fn(),
  getRoutesByChainIds: jest.fn(),
  getTokenByAddress: jest.fn(),
  getBridgeQuoteForExactInput: jest.fn(),
  addTimeoutToPromise: jest.fn(),
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
        priorityChunkSize: 2,
      };

      const results = [
        () => Promise.reject(new Error("First chunk failed 1")),
        () => Promise.reject(new Error("First chunk failed 2")),
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ id: 3, data: "second-chunk-success" }),
              10
            )
          ),
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ id: 4, data: "second-chunk-success-2" }),
              20
            )
          ),
      ];

      const result = await executeStrategies(results, priorityMode);
      expect(result).toEqual({ id: 3, data: "second-chunk-success" });
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
