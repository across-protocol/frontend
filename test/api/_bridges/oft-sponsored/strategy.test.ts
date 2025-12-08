import { BigNumber } from "ethers";
import {
  calculateMaxBpsToSponsor,
  getSponsoredOftQuoteForExactInput,
  getSponsoredOftQuoteForOutput,
  isRouteSupported,
} from "../../../../api/_bridges/oft-sponsored/strategy";
import * as oftUtils from "../../../../api/_bridges/oft/utils/shared";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";
import { Token } from "../../../../api/_dexes/types";
import * as hypercore from "../../../../api/_hypercore";
import * as utils from "../../../../api/_utils";
import * as tokenInfo from "../../../../api/_token-info";

describe("Sponsored OFT Strategy", () => {
  // Shared test fixtures
  const arbitrumUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.ARBITRUM],
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.ARBITRUM,
  };

  const mainnetUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.MAINNET],
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.MAINNET,
  };

  const polygonUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.POLYGON],
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.POLYGON,
  };

  const hypercoreUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
    symbol: "USDT-SPOT",
    decimals: 8,
    chainId: CHAIN_IDs.HYPERCORE,
  };

  const hyperevmUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.HYPEREVM],
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.HYPEREVM,
  };

  const recipient = "0x0000000000000000000000000000000000000001";

  describe("isRouteSupported", () => {
    const arbitrumWETH: Token = {
      address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.ARBITRUM],
      symbol: "WETH",
      decimals: 18,
      chainId: CHAIN_IDs.ARBITRUM,
    };

    describe("Valid routes", () => {
      it("should support USDT → USDT-SPOT from Arbitrum to HyperCore", () => {
        const result = isRouteSupported({
          inputToken: arbitrumUSDT,
          outputToken: hypercoreUSDT,
        });

        expect(result).toBe(true);
      });

      it("should support USDT → USDT-SPOT from Mainnet to HyperCore", () => {
        const result = isRouteSupported({
          inputToken: mainnetUSDT,
          outputToken: hypercoreUSDT,
        });

        expect(result).toBe(true);
      });
    });

    describe("Invalid input tokens", () => {
      it("should reject WETH → USDT-SPOT (unsupported input token)", () => {
        const result = isRouteSupported({
          inputToken: arbitrumWETH,
          outputToken: hypercoreUSDT,
        });

        expect(result).toBe(false);
      });
    });

    describe("Invalid output tokens", () => {
      it("should reject USDT → WETH (unsupported output token)", () => {
        const hypercoreWETH: Token = {
          address: "0x1234567890123456789012345678901234567890",
          symbol: "WETH",
          decimals: 18,
          chainId: CHAIN_IDs.HYPERCORE,
        };

        const result = isRouteSupported({
          inputToken: arbitrumUSDT,
          outputToken: hypercoreWETH,
        });

        expect(result).toBe(false);
      });
    });

    describe("Invalid destination chains", () => {
      it("should reject USDT → USDT on Polygon (wrong destination chain)", () => {
        const result = isRouteSupported({
          inputToken: arbitrumUSDT,
          outputToken: polygonUSDT,
        });

        expect(result).toBe(false);
      });

      it("should reject USDT → USDT on Arbitrum (wrong destination chain)", () => {
        const result = isRouteSupported({
          inputToken: mainnetUSDT,
          outputToken: arbitrumUSDT,
        });

        expect(result).toBe(false);
      });
    });

    describe("Missing OFT messenger", () => {
      it("should reject route from unsupported origin chain", () => {
        const unsupportedChainUSDT: Token = {
          address: "0x1234567890123456789012345678901234567890",
          symbol: "USDT",
          decimals: 6,
          chainId: 99999, // Unsupported chain ID
        };

        const result = isRouteSupported({
          inputToken: unsupportedChainUSDT,
          outputToken: hypercoreUSDT,
        });

        expect(result).toBe(false);
      });
    });

    describe("Missing destination handler", () => {
      it("should reject route to chain without destination handler", () => {
        const arbitrumUSDTOutput: Token = {
          address:
            TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.ARBITRUM] ||
            "0x0",
          symbol: "USDT-SPOT",
          decimals: 8,
          chainId: CHAIN_IDs.ARBITRUM, // Arbitrum doesn't have destination handler
        };

        const result = isRouteSupported({
          inputToken: mainnetUSDT,
          outputToken: arbitrumUSDTOutput,
        });

        expect(result).toBe(false);
      });
    });
  });

  describe("calculateMaxBpsToSponsor", () => {
    const bridgeInputAmount = BigNumber.from("1000000"); // 1 USDT (6 decimals)
    const bridgeOutputAmount = BigNumber.from("1000000"); // 1 USDT (6 decimals on HyperEVM)

    describe("USDT-SPOT output", () => {
      it("should return 0 bps for USDT-SPOT (no swap needed)", async () => {
        const result = await calculateMaxBpsToSponsor({
          outputTokenSymbol: "USDT-SPOT",
          bridgeInputAmount,
          bridgeOutputAmount,
        });

        expect(result.maxBpsToSponsor).toBe(0);
      });
    });

    describe("USDC output", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should return 0 bps when swap has no loss", async () => {
        // Mock simulateMarketOrder to return exactly 1:1 output (no loss)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: BigNumber.from("100000000"), // Exactly 1 USDC worth in 8 decimals
          inputAmount: bridgeOutputAmount,
          averageExecutionPrice: "1.0",
          slippagePercent: 0,
          bestPrice: "1.0",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          outputTokenSymbol: "USDC",
          bridgeInputAmount,
          bridgeOutputAmount,
        });

        expect(result.maxBpsToSponsor).toBe(0);
      });

      it("should return 0 bps when swap has profit", async () => {
        // Mock simulateMarketOrder to return more than expected (profit scenario)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: BigNumber.from("101000000"), // 1.01 USDC (8 decimals on HyperCore)
          inputAmount: bridgeOutputAmount,
          averageExecutionPrice: "1.01",
          slippagePercent: -1,
          bestPrice: "1.01",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          outputTokenSymbol: "USDC",
          bridgeInputAmount,
          bridgeOutputAmount,
        });

        expect(result.maxBpsToSponsor).toBe(0);
      });

      it("should calculate correct bps when swap has 1% loss", async () => {
        // Mock simulateMarketOrder to return 0.99 USDT (1% loss)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: BigNumber.from("99000000"), // 0.99 USDC (8 decimals on HyperCore)
          inputAmount: bridgeOutputAmount,
          averageExecutionPrice: "0.99",
          slippagePercent: 1,
          bestPrice: "0.99",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          outputTokenSymbol: "USDC",
          bridgeInputAmount,
          bridgeOutputAmount,
        });

        // 1% loss = 100 bps
        expect(result.maxBpsToSponsor).toBe(100);
      });

      it("should calculate correct bps when swap has 0.5% loss", async () => {
        // Mock simulateMarketOrder to return 0.995 USDT (0.5% loss)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: BigNumber.from("99500000"), // 0.995 USDC (8 decimals on HyperCore)
          inputAmount: bridgeOutputAmount,
          averageExecutionPrice: "0.995",
          slippagePercent: 0.5,
          bestPrice: "0.995",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          outputTokenSymbol: "USDC",
          bridgeInputAmount,
          bridgeOutputAmount,
        });

        // 0.5% loss = 50 bps
        expect(result.maxBpsToSponsor).toBe(50);
      });

      it("should round up fractional bps", async () => {
        // Mock simulateMarketOrder to return slightly less (0.01% loss)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: BigNumber.from("99990000"), // 0.9999 USDC (8 decimals on HyperCore)
          inputAmount: bridgeOutputAmount,
          averageExecutionPrice: "0.9999",
          slippagePercent: 0.01,
          bestPrice: "0.9999",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          outputTokenSymbol: "USDC",
          bridgeInputAmount,
          bridgeOutputAmount,
        });

        // 0.01% loss = 1 bps (should round up)
        expect(result.maxBpsToSponsor).toBeGreaterThanOrEqual(1);
      });
    });

    describe("Unsupported output token", () => {
      it("should throw error for unsupported output token", async () => {
        await expect(
          calculateMaxBpsToSponsor({
            outputTokenSymbol: "WETH",
            bridgeInputAmount,
            bridgeOutputAmount,
          })
        ).rejects.toThrow("Unsupported output token: WETH");
      });
    });
  });

  describe("getSponsoredOftQuoteForExactInput", () => {
    const exactInputAmount = BigNumber.from("1000000"); // 1 USDT (6 decimals)

    beforeEach(() => {
      jest.clearAllMocks();

      // Mock getCachedTokenInfo to return HyperEVM USDT as intermediary
      jest.spyOn(utils, "getCachedTokenInfo").mockResolvedValue({
        ...hyperevmUSDT,
        name: "USDT",
      });

      // Mock getNativeTokenInfo
      jest.spyOn(tokenInfo, "getNativeTokenInfo").mockReturnValue({
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        decimals: 18,
        chainId: CHAIN_IDs.ARBITRUM,
      });
    });

    it("should convert output from intermediary decimals (6) to output decimals (8)", async () => {
      // Mock getQuote to return 1 USDT in intermediary token decimals (6 decimals)
      jest.spyOn(oftUtils, "getQuote").mockResolvedValue({
        inputAmount: exactInputAmount,
        outputAmount: BigNumber.from("1000000"), // 1 USDT in 6 decimals (HyperEVM)
        nativeFee: BigNumber.from("100000000000000"), // 0.0001 ETH
        oftFeeAmount: BigNumber.from(0),
      });

      jest.spyOn(oftUtils, "getEstimatedFillTime").mockResolvedValue(300);

      const result = await getSponsoredOftQuoteForExactInput({
        inputToken: arbitrumUSDT,
        outputToken: hypercoreUSDT,
        exactInputAmount,
        recipient,
      });

      // Output should be converted to 8 decimals (HyperCore USDT-SPOT)
      expect(result.bridgeQuote.outputAmount.toString()).toBe("100000000"); // 1 USDT in 8 decimals
      expect(result.bridgeQuote.minOutputAmount.toString()).toBe("100000000");
      expect(result.bridgeQuote.inputAmount.toString()).toBe("1000000");
    });

    it("should maintain correct decimal precision for larger amounts", async () => {
      const largeAmount = BigNumber.from("1000000000"); // 1000 USDT (6 decimals)

      jest.spyOn(oftUtils, "getQuote").mockResolvedValue({
        inputAmount: largeAmount,
        outputAmount: BigNumber.from("1000000000"), // 1000 USDT in 6 decimals
        nativeFee: BigNumber.from("100000000000000"),
        oftFeeAmount: BigNumber.from(0),
      });

      jest.spyOn(oftUtils, "getEstimatedFillTime").mockResolvedValue(300);

      const result = await getSponsoredOftQuoteForExactInput({
        inputToken: arbitrumUSDT,
        outputToken: hypercoreUSDT,
        exactInputAmount: largeAmount,
        recipient,
      });

      // Output should be 1000 USDT in 8 decimals
      expect(result.bridgeQuote.outputAmount.toString()).toBe("100000000000"); // 1000 USDT in 8 decimals
    });
  });

  describe("getSponsoredOftQuoteForOutput", () => {
    const minOutputAmount = BigNumber.from("100000000"); // 1 USDT (8 decimals)

    beforeEach(() => {
      jest.clearAllMocks();

      // Mock getCachedTokenInfo to return HyperEVM USDT as intermediary
      jest.spyOn(utils, "getCachedTokenInfo").mockResolvedValue({
        ...hyperevmUSDT,
        name: "USDT",
      });

      // Mock getNativeTokenInfo
      jest.spyOn(tokenInfo, "getNativeTokenInfo").mockReturnValue({
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        decimals: 18,
        chainId: CHAIN_IDs.ARBITRUM,
      });

      // Mock roundAmountToSharedDecimals
      jest
        .spyOn(oftUtils, "roundAmountToSharedDecimals")
        .mockReturnValue(minOutputAmount);
    });

    it("should convert input from output decimals (8) to input decimals (6) and back", async () => {
      // Mock getQuote to return intermediary token output (6 decimals)
      jest.spyOn(oftUtils, "getQuote").mockResolvedValue({
        inputAmount: BigNumber.from("1000000"), // 1 USDT in 6 decimals
        outputAmount: BigNumber.from("1000000"), // 1 USDT in 6 decimals (intermediary)
        nativeFee: BigNumber.from("100000000000000"),
        oftFeeAmount: BigNumber.from(0),
      });

      jest.spyOn(oftUtils, "getEstimatedFillTime").mockResolvedValue(300);

      const result = await getSponsoredOftQuoteForOutput({
        inputToken: arbitrumUSDT,
        outputToken: hypercoreUSDT,
        minOutputAmount,
        recipient,
      });

      // Output should be converted back to 8 decimals
      expect(result.bridgeQuote.outputAmount.toString()).toBe("100000000"); // 1 USDT in 8 decimals
      expect(result.bridgeQuote.minOutputAmount.toString()).toBe("100000000");
      expect(result.bridgeQuote.inputAmount.toString()).toBe("1000000"); // 1 USDT in 6 decimals
    });

    it("should throw error when output is below minimum", async () => {
      // Mock getQuote to return less than minimum
      jest.spyOn(oftUtils, "getQuote").mockResolvedValue({
        inputAmount: BigNumber.from("1000000"),
        outputAmount: BigNumber.from("900000"), // 0.9 USDT in 6 decimals (less than expected)
        nativeFee: BigNumber.from("100000000000000"),
        oftFeeAmount: BigNumber.from(0),
      });

      jest.spyOn(oftUtils, "getEstimatedFillTime").mockResolvedValue(300);

      await expect(
        getSponsoredOftQuoteForOutput({
          inputToken: arbitrumUSDT,
          outputToken: hypercoreUSDT,
          minOutputAmount,
          recipient,
        })
      ).rejects.toThrow();
    });
  });
});
