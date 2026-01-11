import { describe, it } from "vitest";

import {
  A2B_BASE_TEST_CASE,
  JEST_TIMEOUT_MS,
  runEndToEnd,
} from "../utils/execute-approval";

describe("execute response of GET /swap/approval - A2B", () => {
  describe("exactInput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("exactInput", A2B_BASE_TEST_CASE);
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("exactOutput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("exactOutput", A2B_BASE_TEST_CASE);
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("minOutput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("minOutput", A2B_BASE_TEST_CASE);
      },
      JEST_TIMEOUT_MS
    );
  });
});
