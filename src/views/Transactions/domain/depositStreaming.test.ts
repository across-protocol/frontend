/**
 * @jest-environment node
 */
import { IndexerDeposit } from "hooks/useDeposits";
import {
  getDepositId,
  hasDepositChanged,
  calculateStreamDelay,
  initializeStreamingState,
  detectChanges,
  addToDisplayed,
  applyUpdate,
  StreamingConfig,
} from "./depositStreaming";

const createMockDeposit = (
  overrides: Partial<IndexerDeposit> = {}
): IndexerDeposit => ({
  id: 1,
  relayHash: "0x123",
  depositId: "100",
  originChainId: 1,
  destinationChainId: 10,
  depositor: "0xdepositor",
  recipient: "0xrecipient",
  inputToken: "0xinput",
  inputAmount: "1000",
  outputToken: "0xoutput",
  outputAmount: "950",
  message: "",
  messageHash: "",
  exclusiveRelayer: "",
  exclusivityDeadline: "",
  fillDeadline: "",
  quoteTimestamp: "2024-01-01T00:00:00Z",
  depositTransactionHash: "0xtxhash",
  depositTxHash: "0xtxhash",
  depositBlockNumber: 1000,
  depositBlockTimestamp: "2024-01-01",
  status: "unfilled",
  depositRefundTxHash: "",
  swapTokenPriceUsd: "0",
  swapFeeUsd: "0",
  bridgeFeeUsd: "0",
  inputPriceUsd: "1",
  outputPriceUsd: "1",
  fillGasFee: "0",
  fillGasFeeUsd: "0",
  fillGasTokenPriceUsd: "0",
  swapTransactionHash: "",
  swapToken: "",
  swapTokenAmount: "",
  relayer: "",
  fillBlockTimestamp: "",
  fillTx: "",
  speedups: [],
  ...overrides,
});

describe("depositStreaming domain functions", () => {
  describe("getDepositId", () => {
    it("should generate unique ID from originChainId and depositId", () => {
      const deposit = createMockDeposit({
        originChainId: 1,
        depositId: "100",
      });

      expect(getDepositId(deposit)).toBe("1-100");
    });

    it("should generate different IDs for different deposits", () => {
      const deposit1 = createMockDeposit({
        originChainId: 1,
        depositId: "100",
      });
      const deposit2 = createMockDeposit({
        originChainId: 1,
        depositId: "101",
      });
      const deposit3 = createMockDeposit({
        originChainId: 10,
        depositId: "100",
      });

      expect(getDepositId(deposit1)).toBe("1-100");
      expect(getDepositId(deposit2)).toBe("1-101");
      expect(getDepositId(deposit3)).toBe("10-100");
    });
  });

  describe("hasDepositChanged", () => {
    it("should return false when deposits are identical", () => {
      const deposit = createMockDeposit();
      expect(hasDepositChanged(deposit, deposit)).toBe(false);
    });

    it("should return true when status changes", () => {
      const prev = createMockDeposit({ status: "unfilled" });
      const curr = createMockDeposit({ status: "filled" });

      expect(hasDepositChanged(prev, curr)).toBe(true);
    });

    it("should return true when fillTx changes", () => {
      const prev = createMockDeposit({ fillTx: "" });
      const curr = createMockDeposit({ fillTx: "0xfilled" });

      expect(hasDepositChanged(prev, curr)).toBe(true);
    });

    it("should return true when fillBlockTimestamp changes", () => {
      const prev = createMockDeposit({ fillBlockTimestamp: "" });
      const curr = createMockDeposit({ fillBlockTimestamp: "123456" });

      expect(hasDepositChanged(prev, curr)).toBe(true);
    });

    it("should return false when other fields change but tracked fields stay same", () => {
      const prev = createMockDeposit({ relayer: "" });
      const curr = createMockDeposit({ relayer: "0xrelayer" });

      expect(hasDepositChanged(prev, curr)).toBe(false);
    });
  });

  describe("calculateStreamDelay", () => {
    it("should divide refetch interval by queue length", () => {
      expect(calculateStreamDelay(5, 15000)).toBe(3000);
      expect(calculateStreamDelay(10, 15000)).toBe(1500);
      expect(calculateStreamDelay(3, 9000)).toBe(3000);
    });

    it("should return 0 for empty queue", () => {
      expect(calculateStreamDelay(0, 15000)).toBe(0);
    });

    it("should handle single item queue", () => {
      expect(calculateStreamDelay(1, 15000)).toBe(15000);
    });
  });

  describe("initializeStreamingState", () => {
    const config: StreamingConfig = {
      initialStreamCount: 10,
      animationDuration: 1000,
      refetchInterval: 15000,
    };

    it("should return empty state for empty deposits", () => {
      const state = initializeStreamingState([], config, 20);

      expect(state.displayed).toEqual([]);
      expect(state.processed.size).toBe(0);
      expect(state.queue).toEqual([]);
      expect(state.initialized).toBe(true);
    });

    it("should queue first N deposits and display rest", () => {
      const deposits = Array.from({ length: 15 }, (_, i) =>
        createMockDeposit({ depositId: String(i) })
      );

      const state = initializeStreamingState(deposits, config, 20);

      expect(state.queue.length).toBe(10);
      expect(state.displayed.length).toBe(5);
      expect(state.queue[0].depositId).toBe("0");
      expect(state.displayed[0].depositId).toBe("10");
      expect(state.processed.size).toBe(15);
      expect(state.initialized).toBe(true);
    });

    it("should respect maxVisibleRows limit", () => {
      const deposits = Array.from({ length: 30 }, (_, i) =>
        createMockDeposit({ depositId: String(i) })
      );

      const state = initializeStreamingState(deposits, config, 20);

      expect(state.queue.length).toBe(10);
      expect(state.displayed.length).toBe(10);
      expect(state.queue.length + state.displayed.length).toBe(20);
    });

    it("should queue all deposits if count less than initial stream count", () => {
      const deposits = Array.from({ length: 5 }, (_, i) =>
        createMockDeposit({ depositId: String(i) })
      );

      const state = initializeStreamingState(deposits, config, 20);

      expect(state.queue.length).toBe(5);
      expect(state.displayed.length).toBe(0);
    });
  });

  describe("detectChanges", () => {
    it("should detect new deposits", () => {
      const displayed = [
        createMockDeposit({ depositId: "1", originChainId: 1 }),
      ];
      const incoming = [
        createMockDeposit({ depositId: "1", originChainId: 1 }),
        createMockDeposit({ depositId: "2", originChainId: 1 }),
      ];
      const processedIds = new Set(["1-1"]);

      const result = detectChanges(displayed, incoming, processedIds);

      expect(result.newDeposits.length).toBe(1);
      expect(result.newDeposits[0].depositId).toBe("2");
      expect(result.updatedDeposits.length).toBe(0);
    });

    it("should detect updated deposits", () => {
      const displayed = [
        createMockDeposit({
          depositId: "1",
          originChainId: 1,
          status: "unfilled",
        }),
      ];
      const incoming = [
        createMockDeposit({
          depositId: "1",
          originChainId: 1,
          status: "filled",
        }),
      ];
      const processedIds = new Set(["1-1"]);

      const result = detectChanges(displayed, incoming, processedIds);

      expect(result.newDeposits.length).toBe(0);
      expect(result.updatedDeposits.length).toBe(1);
      expect(result.updatedDeposits[0].index).toBe(0);
      expect(result.updatedDeposits[0].deposit.status).toBe("filled");
    });

    it("should detect both new and updated deposits", () => {
      const displayed = [
        createMockDeposit({
          depositId: "1",
          originChainId: 1,
          status: "unfilled",
        }),
        createMockDeposit({
          depositId: "2",
          originChainId: 1,
          status: "unfilled",
        }),
      ];
      const incoming = [
        createMockDeposit({
          depositId: "1",
          originChainId: 1,
          status: "filled",
        }),
        createMockDeposit({
          depositId: "2",
          originChainId: 1,
          status: "unfilled",
        }),
        createMockDeposit({ depositId: "3", originChainId: 1 }),
      ];
      const processedIds = new Set(["1-1", "1-2"]);

      const result = detectChanges(displayed, incoming, processedIds);

      expect(result.newDeposits.length).toBe(1);
      expect(result.newDeposits[0].depositId).toBe("3");
      expect(result.updatedDeposits.length).toBe(1);
      expect(result.updatedDeposits[0].index).toBe(0);
    });

    it("should not flag unchanged deposits as updated", () => {
      const deposit = createMockDeposit({
        depositId: "1",
        originChainId: 1,
        status: "unfilled",
      });
      const displayed = [deposit];
      const incoming = [deposit];
      const processedIds = new Set(["1-1"]);

      const result = detectChanges(displayed, incoming, processedIds);

      expect(result.newDeposits.length).toBe(0);
      expect(result.updatedDeposits.length).toBe(0);
    });
  });

  describe("addToDisplayed", () => {
    it("should prepend deposit to list", () => {
      const current = [
        createMockDeposit({ depositId: "1" }),
        createMockDeposit({ depositId: "2" }),
      ];
      const newDeposit = createMockDeposit({ depositId: "3" });

      const result = addToDisplayed(current, newDeposit, 10);

      expect(result.length).toBe(3);
      expect(result[0].depositId).toBe("3");
      expect(result[1].depositId).toBe("1");
      expect(result[2].depositId).toBe("2");
    });

    it("should respect maxRows limit", () => {
      const current = [
        createMockDeposit({ depositId: "1" }),
        createMockDeposit({ depositId: "2" }),
      ];
      const newDeposit = createMockDeposit({ depositId: "3" });

      const result = addToDisplayed(current, newDeposit, 2);

      expect(result.length).toBe(2);
      expect(result[0].depositId).toBe("3");
      expect(result[1].depositId).toBe("1");
    });

    it("should handle empty current list", () => {
      const newDeposit = createMockDeposit({ depositId: "1" });

      const result = addToDisplayed([], newDeposit, 10);

      expect(result.length).toBe(1);
      expect(result[0].depositId).toBe("1");
    });
  });

  describe("applyUpdate", () => {
    it("should update deposit at specified index", () => {
      const current = [
        createMockDeposit({ depositId: "1", status: "unfilled" }),
        createMockDeposit({ depositId: "2", status: "unfilled" }),
        createMockDeposit({ depositId: "3", status: "unfilled" }),
      ];
      const updated = createMockDeposit({ depositId: "2", status: "filled" });

      const result = applyUpdate(current, 1, updated);

      expect(result.length).toBe(3);
      expect(result[0].status).toBe("unfilled");
      expect(result[1].status).toBe("filled");
      expect(result[1].depositId).toBe("2");
      expect(result[2].status).toBe("unfilled");
    });

    it("should not mutate original array", () => {
      const current = [
        createMockDeposit({ depositId: "1", status: "unfilled" }),
      ];
      const updated = createMockDeposit({ depositId: "1", status: "filled" });

      const result = applyUpdate(current, 0, updated);

      expect(current[0].status).toBe("unfilled");
      expect(result[0].status).toBe("filled");
      expect(result).not.toBe(current);
    });
  });
});
