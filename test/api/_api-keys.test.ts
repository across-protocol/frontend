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
      permissions: ["sponsored-gasless"],
    },
    cb_prod_yyy456: {
      name: "coinbase-secondary",
      enabled: true,
      permissions: ["sponsored-gasless"],
    },
    cb_disabled_key: {
      name: "disabled-key",
      enabled: false,
      permissions: ["sponsored-gasless"],
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
        permissions: ["sponsored-gasless"],
      });
    });

    it("should return valid=true for secondary key", async () => {
      mockGet.mockResolvedValue(mockApiKeysStore);
      const result = await validateApiKey("cb_prod_yyy456");
      expect(result).toEqual({
        valid: true,
        name: "coinbase-secondary",
        permissions: ["sponsored-gasless"],
      });
    });

    it("should bypass validation when DISABLE_API_KEY_VALIDATION is set", async () => {
      vi.stubEnv("DISABLE_API_KEY_VALIDATION", "true");
      const result = await validateApiKey("any_key");
      expect(result).toEqual({
        valid: true,
        name: "local-dev",
        permissions: ["sponsored-gasless"],
      });
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("should return valid=false when Edge Config returns null", async () => {
      mockGet.mockResolvedValue(null);
      const result = await validateApiKey("cb_prod_xxx123");
      expect(result).toEqual({ valid: false });
    });
  });

  describe("hasPermission", () => {
    it("should return false for undefined permissions", () => {
      const result = hasPermission(undefined, "sponsored-gasless");
      expect(result).toBe(false);
    });

    it("should return false for empty permissions array", () => {
      const result = hasPermission([], "sponsored-gasless");
      expect(result).toBe(false);
    });

    it("should return true when permission is included", () => {
      const permissions: Permission[] = ["sponsored-gasless"];
      expect(hasPermission(permissions, "sponsored-gasless")).toBe(true);
    });

    it("should return false when permission is not included", () => {
      const permissions: Permission[] = [];
      expect(hasPermission(permissions, "sponsored-gasless")).toBe(false);
    });
  });
});
