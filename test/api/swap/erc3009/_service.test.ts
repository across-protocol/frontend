import { describe, test, expect } from "vitest";

import { AuthQueryParamsSchema } from "../../../../api/swap/erc3009/_service";

describe("swap/erc3009/_service", () => {
  describe("AuthQueryParamsSchema", () => {
    test("should accept valid authStart as positive integer string", () => {
      const result = AuthQueryParamsSchema.validate({
        authStart: "1700000000",
      });
      expect(result[0]).toBeUndefined();
    });

    test("should accept valid authDeadline as positive integer string", () => {
      const result = AuthQueryParamsSchema.validate({
        authDeadline: "1800000000",
      });
      expect(result[0]).toBeUndefined();
    });

    test("should accept both authStart and authDeadline", () => {
      const result = AuthQueryParamsSchema.validate({
        authStart: "1700000000",
        authDeadline: "1800000000",
      });
      expect(result[0]).toBeUndefined();
    });

    test("should accept empty object (optional params)", () => {
      const result = AuthQueryParamsSchema.validate({});
      expect(result[0]).toBeUndefined();
    });

    test("should reject negative authStart", () => {
      const result = AuthQueryParamsSchema.validate({
        authStart: "-100",
      });
      expect(result[0]).toBeDefined();
    });

    test("should reject non-numeric authStart", () => {
      const result = AuthQueryParamsSchema.validate({
        authStart: "abc",
      });
      expect(result[0]).toBeDefined();
    });

    test("should accept authStart=0 (special case for epoch)", () => {
      const result = AuthQueryParamsSchema.validate({
        authStart: "0",
      });
      expect(result[0]).toBeUndefined();
    });
  });
});
