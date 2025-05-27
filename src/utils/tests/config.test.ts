import { ConfigClient } from "../config";
import { getRoutes, ChainId } from "../constants";

describe("ConfigClient", () => {
  const routeConfig = getRoutes(1);
  const config = new ConfigClient(routeConfig);

  describe("getTokenInfoBySymbolSafe", () => {
    it("should return token info for ETH on mainnet", () => {
      const token = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "ETH");
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("ETH");
      expect(token?.address).toBeDefined();
      expect(token?.isNative).toBe(true);
    });

    it("should return token info for WETH on mainnet", () => {
      const token = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "WETH");
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("WETH");
      expect(token?.address).toBeDefined();
      expect(token?.isNative).toBe(false);
    });

    it("should return token info for USDC on mainnet", () => {
      const token = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "USDC");
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("USDC");
      expect(token?.address).toBeDefined();
      expect(token?.decimals).toBe(6);
    });

    it("should return undefined for non-existent token", () => {
      const token = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "NONEXISTENT"
      );
      expect(token).toBeUndefined();
    });

    it("should handle case-insensitive symbol matching", () => {
      const token = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "eth");
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("ETH");
    });

    it("should return undefined for unsupported chain", () => {
      const token = config.getTokenInfoBySymbolSafe(999999, "ETH");
      expect(token).toBeUndefined();
    });

    it("should return token info with correct decimals", () => {
      const usdcToken = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "USDC"
      );
      expect(usdcToken?.decimals).toBe(6);

      const usdtToken = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "USDT"
      );
      expect(usdtToken?.decimals).toBe(6);
    });

    it("should return token info with correct l1TokenAddress", () => {
      const token = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "ETH");
      expect(token?.l1TokenAddress).toBeDefined();
      expect(token?.l1TokenAddress).toBe(token?.address);
    });

    it("should USDC-BNB and USDT-BNB correctly", () => {
      const usdc = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "USDC");
      const usdt = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "USDT");
      const mainnetUsdcBnb = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "USDC-BNB"
      );
      const bscUsdc = config.getTokenInfoBySymbolSafe(ChainId.BSC, "USDC-BNB");
      const mainnetUsdtBnb = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "USDT-BNB"
      );
      const bscUsdt = config.getTokenInfoBySymbolSafe(ChainId.BSC, "USDT-BNB");

      expect(mainnetUsdcBnb).toBeDefined();
      expect(bscUsdc).toBeDefined();
      expect(mainnetUsdtBnb).toBeDefined();
      expect(bscUsdt).toBeDefined();
      expect(mainnetUsdcBnb?.decimals).toBe(usdc?.decimals);
      expect(bscUsdc?.decimals).toBe(18);
      expect(mainnetUsdtBnb?.decimals).toBe(usdt?.decimals);
      expect(bscUsdt?.decimals).toBe(18);
    });
  });

  describe("getTokenInfoByAddressSafe", () => {
    it("should return token info for ETH address on mainnet", () => {
      const ethToken = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "ETH");
      const token = config.getTokenInfoByAddressSafe(
        ChainId.MAINNET,
        ethToken!.address
      );
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("ETH");
      expect(token?.address).toBe(ethToken!.address);
      expect(token?.isNative).toBe(true);
    });

    it("should return token info for USDC address on mainnet", () => {
      const usdcToken = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "USDC"
      );
      const token = config.getTokenInfoByAddressSafe(
        ChainId.MAINNET,
        usdcToken!.address
      );
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("USDC");
      expect(token?.address).toBe(usdcToken!.address);
      expect(token?.decimals).toBe(6);
    });

    it("should return undefined for non-existent address", () => {
      const token = config.getTokenInfoByAddressSafe(
        ChainId.MAINNET,
        "0x0000000000000000000000000000000000000000"
      );
      expect(token).toBeUndefined();
    });

    it("should return undefined for unsupported chain", () => {
      const ethToken = config.getTokenInfoBySymbolSafe(ChainId.MAINNET, "ETH");
      const token = config.getTokenInfoByAddressSafe(999999, ethToken!.address);
      expect(token).toBeUndefined();
    });

    it("should handle ambiguous tokens correctly", () => {
      // Test with USDC which might have multiple implementations
      const usdcToken = config.getTokenInfoBySymbolSafe(
        ChainId.MAINNET,
        "USDC"
      );
      const token = config.getTokenInfoByAddressSafe(
        ChainId.MAINNET,
        usdcToken!.address
      );
      expect(token).toBeDefined();
      expect(token?.symbol).toBe("USDC");
      expect(token?.address).toBe(usdcToken!.address);
    });
  });
});
