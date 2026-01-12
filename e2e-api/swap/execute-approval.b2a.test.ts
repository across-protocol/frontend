import { describe, expect, it } from "vitest";

import { executeApprovalAndDeposit } from "../utils/deposit";

import {
  B2A_BASE_TEST_CASE,
  JEST_TIMEOUT_MS,
  prepEndToEndExecution,
  runEndToEnd,
} from "../utils/execute-approval";

describe("execute response of GET /swap/approval - B2A", () => {
  describe("exactInput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("exactInput", B2A_BASE_TEST_CASE, {
          retryFill: true,
        });
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("exactOutput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("exactOutput", B2A_BASE_TEST_CASE, {
          retryFill: true,
        });
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("minOutput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("minOutput", B2A_BASE_TEST_CASE, {
          retryFill: true,
        });
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("deposit expiry", () => {
    it(
      "should revert if expired",
      async () => {
        const { originClient, swapQuote } = await prepEndToEndExecution(
          "exactInput",
          B2A_BASE_TEST_CASE
        );
        const blockNumber = await originClient.getBlockNumber();

        // Mine next block to make the deposit expired (2 minutes from now)
        await originClient.tevmMine({ blockCount: 2, interval: 2 * 60 });

        await expect(
          executeApprovalAndDeposit(swapQuote, originClient)
        ).rejects.toThrow(/revert/);

        await originClient.reset({ blockNumber });
      },
      JEST_TIMEOUT_MS
    );
  });
});
