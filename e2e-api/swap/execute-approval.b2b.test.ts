import { describe, it } from "vitest";

import {
  B2B_BASE_TEST_CASE,
  JEST_TIMEOUT_MS,
  runEndToEnd,
} from "../utils/execute-approval";

describe("execute response of GET /swap/approval - B2B", () => {
  describe("exactInput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("exactInput", B2B_BASE_TEST_CASE);
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("minOutput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("minOutput", B2B_BASE_TEST_CASE);
      },
      JEST_TIMEOUT_MS
    );
  });

  describe("exactOutput", () => {
    it(
      "should fetch, execute deposit, and fill the relay",
      async () => {
        await runEndToEnd("exactOutput", B2B_BASE_TEST_CASE);
      },
      JEST_TIMEOUT_MS
    );
  });
});
