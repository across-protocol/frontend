import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateApiKey,
  type Permission,
  type ApiKeysStore,
} from "../../api/_api-keys";
import { hasPermission } from "../../api/_auth";

// Mock the @vercel/edge-config module
const mockGet = vi.fn();
vi.mock("@vercel/edge-config", () => ({
  createClient: () => ({
    get: mockGet,
  }),
}));

describe("_api-keys", () => {
  const mockApiKeysStore: ApiKeysStore = {
    cb_prod_xxx123: {
      name: "coinbase",
      enabled: true,
      permissions: ["sponsored-cctp", "sponsored-oft", "rate-limit-bypass"],
      rateLimit: 1000,
      createdAt: "2026-01-30T00:00:00Z",
    },
    cb_prod_yyy456: {
      name: "coinbase-secondary",
      enabled: true,
      permissions: ["sponsored-cctp"],
      rateLimit: 100,
      createdAt: "2026-01-30T00:00:00Z",
    },
    cb_disabled_key: {
      name: "disabled-key",
      enabled: false,
      permissions: ["sponsored-cctp"],
      createdAt: "2026-01-30T00:00:00Z",
    },
  };

  beforeEach(() => {
    vi.stubEnv("EDGE_CONFIG", "https://edge-config.vercel.com/test");
    mockGet.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("validateApiKey", () => {
    it("should return valid=false for undefined apiKey", async () => {
      const result = await validateApiKey(undefined);
      expect(result).toEqual({ valid: false });
    });

    it("should return valid=false for empty string apiKey", async () => {
      const result = await validateApiKey("");
      expect(result).toEqual({ valid: false });
    });

    it("should return valid=false when EDGE_CONFIG is not set", async () => {
      vi.unstubAllEnvs();
      const result = await validateApiKey("cb_prod_xxx123");
      expect(result).toEqual({ valid: false });
    });

    it("should return valid=false for non-existent apiKey", async () => {
      mockGet.mockResolvedValue(mockApiKeysStore);
      const result = await validateApiKey("non_existent_key");
      expect(result).toEqual({ valid: false });
    });

    it("should return valid=false for disabled apiKey", async () => {
      mockGet.mockResolvedValue(mockApiKeysStore);
      const result = await validateApiKey("cb_disabled_key");
      expect(result).toEqual({ valid: false });
    });

    it("should return valid=true with name and permissions for valid apiKey", async () => {
      mockGet.mockResolvedValue(mockApiKeysStore);
      const result = await validateApiKey("cb_prod_xxx123");
      expect(result).toEqual({
        valid: true,
        name: "coinbase",
        permissions: ["sponsored-cctp", "sponsored-oft", "rate-limit-bypass"],
      });
    });

    it("should return valid=true for secondary key with limited permissions", async () => {
      mockGet.mockResolvedValue(mockApiKeysStore);
      const result = await validateApiKey("cb_prod_yyy456");
      expect(result).toEqual({
        valid: true,
        name: "coinbase-secondary",
        permissions: ["sponsored-cctp"],
      });
    });

    it("should return valid=false when Edge Config returns null", async () => {
      mockGet.mockResolvedValue(null);
      const result = await validateApiKey("cb_prod_xxx123");
      expect(result).toEqual({ valid: false });
    });
  });

  describe("hasPermission", () => {
    it("should return false for undefined permissions", () => {
      const result = hasPermission(undefined, "sponsored-cctp");
      expect(result).toBe(false);
    });

    it("should return false for empty permissions array", () => {
      const result = hasPermission([], "sponsored-cctp");
      expect(result).toBe(false);
    });

    it("should return true when permission is included", () => {
      const permissions: Permission[] = [
        "sponsored-cctp",
        "sponsored-oft",
        "rate-limit-bypass",
      ];
      expect(hasPermission(permissions, "sponsored-cctp")).toBe(true);
      expect(hasPermission(permissions, "sponsored-oft")).toBe(true);
      expect(hasPermission(permissions, "rate-limit-bypass")).toBe(true);
    });

    it("should return false when permission is not included", () => {
      const permissions: Permission[] = ["sponsored-cctp"];
      expect(hasPermission(permissions, "sponsored-oft")).toBe(false);
      expect(hasPermission(permissions, "rate-limit-bypass")).toBe(false);
    });
  });
});
