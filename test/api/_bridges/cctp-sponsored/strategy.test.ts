import { BigNumber, ethers, utils } from "ethers";
import {
  buildEvmTxForAllowanceHolder,
  calculateMaxBpsToSponsor,
  getQuoteForExactInput,
  getQuoteForOutput,
  isRouteSupported,
} from "../../../../api/_bridges/cctp-sponsored/strategy";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";
import {
  Token,
  CrossSwapQuotes,
  CrossSwap,
} from "../../../../api/_dexes/types";
import * as hypercore from "../../../../api/_hypercore";
import { ConvertDecimals } from "../../../../api/_utils";
import { AMOUNT_TYPE } from "../../../../api/_dexes/utils";
import * as cctpHypercore from "../../../../api/_bridges/cctp/utils/hypercore";
import { SPONSORED_CCTP_SRC_PERIPHERY_ADDRESSES } from "../../../../api/_bridges/cctp-sponsored/utils/constants";
import { getEnvs } from "../../../../api/_env";

// Mock the environment variables to ensure tests are deterministic.
jest.mock("../../../../api/_env", () => ({
  getEnvs: jest.fn(),
}));

describe("api/_bridges/cctp-sponsored/strategy", () => {
  const arbitrumUSDC: Token = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM_SEPOLIA],
    chainId: CHAIN_IDs.ARBITRUM_SEPOLIA,
  };

  const hyperCoreUSDC: Token = {
    ...TOKEN_SYMBOLS_MAP["USDC"],
    address: TOKEN_SYMBOLS_MAP["USDC"].addresses[CHAIN_IDs.HYPERCORE_TESTNET],
    chainId: CHAIN_IDs.HYPERCORE_TESTNET,
  };

  const hyperCoreUSDHSpot: Token = {
    ...TOKEN_SYMBOLS_MAP["USDH-SPOT"],
    address:
      TOKEN_SYMBOLS_MAP["USDH-SPOT"].addresses[CHAIN_IDs.HYPERCORE_TESTNET],
    chainId: CHAIN_IDs.HYPERCORE_TESTNET,
  };

  const baseWETH: Token = {
    ...TOKEN_SYMBOLS_MAP.WETH,
    address: TOKEN_SYMBOLS_MAP.WETH.addresses[CHAIN_IDs.BASE],
    chainId: CHAIN_IDs.BASE,
  };

  describe("#isRouteSupported()", () => {
    test("should return true for Arbitrum USDC -> HyperCore USDC", () => {
      expect(
        isRouteSupported({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
        })
      ).toBe(true);
    });

    test("should return true for Arbitrum USDC -> HyperCore USDH-SPOT", () => {
      expect(
        isRouteSupported({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
        })
      ).toBe(true);
    });

    test("should return false for Arbitrum USDC -> HyperCore USDT-SPOT", () => {
      expect(
        isRouteSupported({
          inputToken: arbitrumUSDC,
          outputToken: {
            ...TOKEN_SYMBOLS_MAP.USDT,
            address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.BASE],
            chainId: CHAIN_IDs.BASE,
          },
        })
      ).toBe(false);
    });
  });

  describe("#calculateMaxBpsToSponsor()", () => {
    const inputAmount = utils.parseUnits("1", arbitrumUSDC.decimals);
    const maxFee = utils.parseUnits("0.0001", arbitrumUSDC.decimals); // 0.01% = 1 bps

    describe("USDC output (no swap needed)", () => {
      test("should return correct maxFeeBps", async () => {
        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps
        expect(result).toBe(1);
      });

      test("should return correct maxFeeBps for different maxFee amounts", async () => {
        const largerMaxFee = utils.parseUnits("0.005", arbitrumUSDC.decimals); // 0.5% = 50 bps

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          maxFee: largerMaxFee,
          inputAmount,
        });

        // maxFeeBps = 0.005 / 1 * 10000 = 50 bps
        expect(result).toBe(50);
      });

      test("should return correct maxFeeBps for different input amount", async () => {
        const largerInputAmount = utils.parseUnits("10", arbitrumUSDC.decimals); // 10 USDC

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          maxFee,
          inputAmount: largerInputAmount,
        });

        // maxFeeBps = 0.0001 / 10 * 10000 = 0.1 bps
        expect(result).toBe(0.1);
      });
    });

    describe("USDH-SPOT output (swap flow)", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      test("should return maxFeeBps when swap has no loss", async () => {
        // Mock simulateMarketOrder to return exactly 1:1 output (no loss)
        const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
        const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
          arbitrumUSDC.decimals,
          hyperCoreUSDHSpot.decimals
        )(bridgeOutputAmountInputTokenDecimals);

        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: bridgeOutputAmountOutputTokenDecimals,
          inputAmount: bridgeOutputAmountOutputTokenDecimals,
          averageExecutionPrice: "1.0",
          slippagePercent: 0,
          bestPrice: "1.0",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps, slippage = 0, so result = 1 bps
        expect(result).toBe(1);
      });

      test("should return maxFeeBps when swap has profit", async () => {
        const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
        const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
          arbitrumUSDC.decimals,
          hyperCoreUSDHSpot.decimals
        )(bridgeOutputAmountInputTokenDecimals);

        // Mock simulateMarketOrder to return more than expected (profit scenario)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: utils.parseUnits("1.1", hyperCoreUSDHSpot.decimals), // 1.1 USDH (8 decimals)
          inputAmount: bridgeOutputAmountOutputTokenDecimals,
          averageExecutionPrice: "1.1",
          slippagePercent: -1,
          bestPrice: "1.1",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps, slippage is negative (profit), so result = 1 bps
        expect(result).toBe(1);
      });

      test("should calculate correct bps when swap has 1% loss", async () => {
        const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
        const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
          arbitrumUSDC.decimals,
          hyperCoreUSDHSpot.decimals
        )(bridgeOutputAmountInputTokenDecimals);

        // Mock simulateMarketOrder to return 0.99 output (1% loss)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: utils.parseUnits("0.98901", hyperCoreUSDHSpot.decimals), // input amount - maxFee - 1% loss
          inputAmount: bridgeOutputAmountOutputTokenDecimals,
          averageExecutionPrice: "0.99",
          slippagePercent: 1,
          bestPrice: "0.99",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps, slippage = 1% = 100 bps, so result = 1 + 100 = 101 bps
        expect(result).toBe(101);
      });

      test("should calculate correct bps when swap has 0.5% loss", async () => {
        const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
        const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
          arbitrumUSDC.decimals,
          hyperCoreUSDHSpot.decimals
        )(bridgeOutputAmountInputTokenDecimals);

        // Mock simulateMarketOrder to return 0.995 output (0.5% loss)
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: utils.parseUnits(
            "0.994005",
            hyperCoreUSDHSpot.decimals
          ), // input amount - maxFee - 0.5% loss
          inputAmount: bridgeOutputAmountOutputTokenDecimals,
          averageExecutionPrice: "0.995",
          slippagePercent: 0.5,
          bestPrice: "0.995",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps, slippage = 0.5% = 50 bps, so result = 1 + 50 = 51 bps
        expect(result).toBe(51);
      });

      test("should handle fractional slippage correctly", async () => {
        const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
        const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
          arbitrumUSDC.decimals,
          hyperCoreUSDHSpot.decimals
        )(bridgeOutputAmountInputTokenDecimals);

        // Mock simulateMarketOrder to return 0.01% loss
        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: utils.parseUnits(
            "0.9989001",
            hyperCoreUSDHSpot.decimals
          ), // input amount - maxFee - 0.01% loss
          inputAmount: bridgeOutputAmountOutputTokenDecimals,
          averageExecutionPrice: "0.9999",
          slippagePercent: 0.01,
          bestPrice: "0.9999",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps, slippage = 0.01% = 1 bps, so result = 1 + 1 = 2 bps
        expect(result).toBe(2);
      });

      test("should handle zero slippage correctly", async () => {
        const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
        const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
          arbitrumUSDC.decimals,
          hyperCoreUSDHSpot.decimals
        )(bridgeOutputAmountInputTokenDecimals);

        jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
          outputAmount: bridgeOutputAmountOutputTokenDecimals,
          inputAmount: bridgeOutputAmountOutputTokenDecimals,
          averageExecutionPrice: "1.0",
          slippagePercent: 0,
          bestPrice: "1.0",
          levelsConsumed: 1,
          fullyFilled: true,
        });

        const result = await calculateMaxBpsToSponsor({
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          maxFee,
          inputAmount,
        });

        // maxFeeBps = 0.0001 / 1 * 10000 = 1 bps, slippage = 0, so result = 1 bps
        expect(result).toBe(1);
      });
    });

    describe("Unsupported route", () => {
      test("should throw error for unsupported route", async () => {
        const unsupportedToken: Token = {
          address: "0x1234567890123456789012345678901234567890",
          symbol: "WETH",
          decimals: 18,
          chainId: CHAIN_IDs.ARBITRUM,
        };

        await expect(
          calculateMaxBpsToSponsor({
            inputToken: arbitrumUSDC,
            outputToken: unsupportedToken,
            maxFee,
            inputAmount,
          })
        ).rejects.toThrow();
      });
    });
  });

  describe("#getQuoteForExactInput()", () => {
    test("should return correct bridge quote with converted decimals", async () => {
      const exactInputAmount = utils.parseUnits("1", arbitrumUSDC.decimals);

      const result = await getQuoteForExactInput({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        exactInputAmount,
      });

      expect(result.bridgeQuote.inputToken).toEqual(arbitrumUSDC);
      expect(result.bridgeQuote.outputToken).toEqual(hyperCoreUSDC);
      expect(result.bridgeQuote.inputAmount).toEqual(exactInputAmount);
      // Output should be converted from 6 decimals to 6 decimals (HyperCore USDC perp)
      expect(result.bridgeQuote.outputAmount.toString()).toBe("1000000"); // 1 USDC in 6 decimals
      expect(result.bridgeQuote.minOutputAmount).toEqual(
        result.bridgeQuote.outputAmount
      );
      expect(result.bridgeQuote.provider).toBe("sponsored-cctp");
      expect(result.bridgeQuote.estimatedFillTimeSec).toBeGreaterThan(0);
    });

    test("should throw error for unsupported route", async () => {
      await expect(
        getQuoteForExactInput({
          inputToken: arbitrumUSDC,
          outputToken: baseWETH,
          exactInputAmount: utils.parseUnits("1", arbitrumUSDC.decimals),
        })
      ).rejects.toThrow();
    });
  });

  describe("#getQuoteForOutput()", () => {
    test("should return correct bridge quote with converted decimals", async () => {
      const minOutputAmount = utils.parseUnits("1", hyperCoreUSDC.decimals);

      const result = await getQuoteForOutput({
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        minOutputAmount,
      });

      expect(result.bridgeQuote.inputToken).toEqual(arbitrumUSDC);
      expect(result.bridgeQuote.outputToken).toEqual(hyperCoreUSDC);
      // Input should be converted from 8 decimals to 6 decimals
      expect(result.bridgeQuote.inputAmount.toString()).toBe("1000000"); // 1 USDC in 6 decimals
      expect(result.bridgeQuote.outputAmount).toEqual(minOutputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(minOutputAmount);
      expect(result.bridgeQuote.provider).toBe("sponsored-cctp");
      expect(result.bridgeQuote.estimatedFillTimeSec).toBeGreaterThan(0);
    });

    test("should throw error for unsupported route", async () => {
      await expect(
        getQuoteForOutput({
          inputToken: arbitrumUSDC,
          outputToken: baseWETH,
          minOutputAmount: utils.parseUnits("1", baseWETH.decimals),
        })
      ).rejects.toThrow();
    });
  });

  describe("#buildEvmTxForAllowanceHolder()", () => {
    const depositor = "0x0000000000000000000000000000000000000001";
    const recipient = "0x0000000000000000000000000000000000000002";
    const inputAmount = utils.parseUnits("1", arbitrumUSDC.decimals);
    const outputAmount = utils.parseUnits("1", hyperCoreUSDC.decimals);
    const TEST_WALLET = ethers.Wallet.createRandom();
    const TEST_PRIVATE_KEY = TEST_WALLET.privateKey;

    beforeEach(() => {
      jest.clearAllMocks();
      // Before each test, mock the return value of getEnvs to provide our test private key.
      (getEnvs as jest.Mock).mockReturnValue({
        SPONSORSHIP_SIGNER_PRIVATE_KEY: TEST_PRIVATE_KEY,
      });
    });

    test("should build transaction correctly for USDC output", async () => {
      const crossSwap: CrossSwap = {
        amount: inputAmount,
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        depositor,
        recipient,
        slippageTolerance: 1,
        type: AMOUNT_TYPE.EXACT_INPUT,
        refundOnOrigin: false,
        embeddedActions: [],
        strictTradeType: false,
      };

      const quotes: CrossSwapQuotes = {
        crossSwap,
        bridgeQuote: {
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          inputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: 300,
          provider: "sponsored-cctp",
          fees: {
            totalRelay: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerCapital: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerGas: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            lp: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            bridgeFee: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
          },
        },
        contracts: {
          depositEntryPoint: {
            address: "0x0000000000000000000000000000000000000000",
            name: "SpokePoolPeriphery",
          },
        },
      };

      // Mock getCctpFees
      jest.spyOn(cctpHypercore, "getCctpFees").mockResolvedValue({
        transferFeeBps: 10,
        forwardFee: BigNumber.from(
          utils.parseUnits("0.1", arbitrumUSDC.decimals)
        ),
      });

      const result = await buildEvmTxForAllowanceHolder({
        quotes,
      });

      expect(result.chainId).toBe(arbitrumUSDC.chainId);
      expect(result.from).toBe(depositor);
      expect(result.to).toBe(
        SPONSORED_CCTP_SRC_PERIPHERY_ADDRESSES[CHAIN_IDs.ARBITRUM_SEPOLIA]
      );
      expect(result.value).toEqual(BigNumber.from(0));
      expect(result.ecosystem).toBe("evm");
      expect(result.data).toBeTruthy();
      expect(typeof result.data).toBe("string");
    });

    test("should build transaction correctly for USDH-SPOT output (with swap)", async () => {
      const crossSwap: CrossSwap = {
        amount: inputAmount,
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDHSpot,
        depositor,
        recipient,
        slippageTolerance: 1,
        type: AMOUNT_TYPE.EXACT_INPUT,
        refundOnOrigin: false,
        embeddedActions: [],
        strictTradeType: false,
      };

      const bridgeOutputAmount = ConvertDecimals(
        arbitrumUSDC.decimals,
        hyperCoreUSDHSpot.decimals
      )(inputAmount);

      const quotes: CrossSwapQuotes = {
        crossSwap,
        bridgeQuote: {
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDHSpot,
          inputAmount,
          outputAmount: bridgeOutputAmount,
          minOutputAmount: bridgeOutputAmount,
          estimatedFillTimeSec: 300,
          provider: "sponsored-cctp",
          fees: {
            totalRelay: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerCapital: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerGas: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            lp: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            bridgeFee: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
          },
        },
        contracts: {
          depositEntryPoint: {
            address: "0x0000000000000000000000000000000000000000",
            name: "SpokePoolPeriphery",
          },
        },
      };

      // Mock getCctpFees
      jest.spyOn(cctpHypercore, "getCctpFees").mockResolvedValue({
        transferFeeBps: 10,
        forwardFee: BigNumber.from(
          utils.parseUnits("0.1", arbitrumUSDC.decimals)
        ),
      });

      // Mock simulateMarketOrder (called inside calculateMaxBpsToSponsor)
      // Calculate maxFee the same way buildEvmTxForAllowanceHolder does
      const transferFee = inputAmount.mul(10).div(10_000);
      const forwardFee = BigNumber.from(
        utils.parseUnits("0.1", arbitrumUSDC.decimals)
      );
      const maxFee = transferFee.add(forwardFee);
      const bridgeOutputAmountInputTokenDecimals = inputAmount.sub(maxFee);
      const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
        arbitrumUSDC.decimals,
        hyperCoreUSDHSpot.decimals
      )(bridgeOutputAmountInputTokenDecimals);

      jest.spyOn(hypercore, "simulateMarketOrder").mockResolvedValue({
        outputAmount: bridgeOutputAmountOutputTokenDecimals,
        inputAmount: bridgeOutputAmountOutputTokenDecimals,
        averageExecutionPrice: "1.0",
        slippagePercent: 0,
        bestPrice: "1.0",
        levelsConsumed: 1,
        fullyFilled: true,
      });

      const result = await buildEvmTxForAllowanceHolder({
        quotes,
      });

      expect(result.chainId).toBe(arbitrumUSDC.chainId);
      expect(result.from).toBe(depositor);
      expect(result.to).toBe(
        SPONSORED_CCTP_SRC_PERIPHERY_ADDRESSES[CHAIN_IDs.ARBITRUM_SEPOLIA]
      );
      expect(result.value).toEqual(BigNumber.from(0));
      expect(result.ecosystem).toBe("evm");
      expect(result.data).toBeTruthy();
    });

    test("should throw error when app fee is provided", async () => {
      const crossSwap: CrossSwap = {
        amount: inputAmount,
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        depositor,
        recipient,
        slippageTolerance: 1,
        type: AMOUNT_TYPE.EXACT_INPUT,
        refundOnOrigin: false,
        embeddedActions: [],
        strictTradeType: false,
      };

      const quotes: CrossSwapQuotes = {
        crossSwap,
        bridgeQuote: {
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          inputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: 300,
          provider: "sponsored-cctp",
          fees: {
            totalRelay: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerCapital: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerGas: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            lp: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            bridgeFee: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
          },
        },
        contracts: {
          depositEntryPoint: {
            address: "0x0000000000000000000000000000000000000000",
            name: "SpokePoolPeriphery",
          },
        },
        appFee: {
          feeAmount: BigNumber.from(1),
          feeToken: arbitrumUSDC,
          feeActions: [],
        },
      };

      jest.spyOn(cctpHypercore, "getCctpFees").mockResolvedValue({
        transferFeeBps: 10,
        forwardFee: BigNumber.from(
          utils.parseUnits("0.1", arbitrumUSDC.decimals)
        ),
      });

      await expect(buildEvmTxForAllowanceHolder({ quotes })).rejects.toThrow(
        "App fee is not supported"
      );
    });

    test("should throw error when origin swap quote is provided", async () => {
      const crossSwap: CrossSwap = {
        amount: inputAmount,
        inputToken: arbitrumUSDC,
        outputToken: hyperCoreUSDC,
        depositor,
        recipient,
        slippageTolerance: 1,
        type: AMOUNT_TYPE.EXACT_INPUT,
        refundOnOrigin: false,
        embeddedActions: [],
        strictTradeType: false,
      };

      const quotes: CrossSwapQuotes = {
        crossSwap,
        bridgeQuote: {
          inputToken: arbitrumUSDC,
          outputToken: hyperCoreUSDC,
          inputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: 300,
          provider: "sponsored-cctp",
          fees: {
            totalRelay: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerCapital: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            relayerGas: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            lp: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
            bridgeFee: {
              total: BigNumber.from(0),
              pct: BigNumber.from(0),
              token: arbitrumUSDC,
            },
          },
        },
        contracts: {
          depositEntryPoint: {
            address: "0x0000000000000000000000000000000000000000",
            name: "SpokePoolPeriphery",
          },
        },
        originSwapQuote: {} as any,
      };

      jest.spyOn(cctpHypercore, "getCctpFees").mockResolvedValue({
        transferFeeBps: 10,
        forwardFee: BigNumber.from(
          utils.parseUnits("0.1", arbitrumUSDC.decimals)
        ),
      });

      await expect(buildEvmTxForAllowanceHolder({ quotes })).rejects.toThrow(
        "Origin/destination swaps are not supported"
      );
    });
  });
});
