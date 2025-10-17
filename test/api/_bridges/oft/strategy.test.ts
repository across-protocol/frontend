import {
  getHyperLiquidComposerMessage,
  isRouteSupported,
  getOftCrossSwapTypes,
  getQuote,
  getEstimatedFillTime,
  getOftQuoteForExactInput,
  getRequiredDVNCount,
  buildOftTx,
} from "../../../../api/_bridges/oft/strategy";
import {
  HYPEREVM_OFT_COMPOSER_ADDRESSES,
  OFT_MESSENGERS,
} from "../../../../api/_bridges/oft/utils/constants";
import { CHAIN_IDs } from "@across-protocol/constants";
import { CrossSwapQuotes, Token } from "../../../../api/_dexes/types";
import { ethers, BigNumber } from "ethers";
import { CROSS_SWAP_TYPE } from "../../../../api/_dexes/utils";
import { getRpcUrlsFromConfigJson } from "../../../../api/_providers";
import { TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";

describe("OFT Strategy", () => {
  describe("getHyperLiquidComposerMessage", () => {
    const recipient = "0x0000000000000000000000000000000000000001";
    const tokenSymbol = "USDT-SPOT";

    it("should return the correct message for HyperLiquid", () => {
      const { composeMsg, toAddress, extraOptions } =
        getHyperLiquidComposerMessage(recipient, tokenSymbol);

      const expectedComposeMsg = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address"],
        [0, recipient]
      );

      expect(composeMsg).toBe(expectedComposeMsg);
      expect(toAddress).toBe(HYPEREVM_OFT_COMPOSER_ADDRESSES[tokenSymbol]);
      expect(extraOptions).toBe(
        "0x00030100130300000000000000000000000000000000ea60"
      );
    });

    it("should throw an error for an unsupported token", () => {
      const unsupportedToken = "UNSUPPORTED";
      expect(() =>
        getHyperLiquidComposerMessage(recipient, unsupportedToken)
      ).toThrow(
        `OFT: No Hyperliquid Composer contract configured for token ${unsupportedToken}`
      );
    });
  });

  describe("isRouteSupported", () => {
    it("should return true for all supported routes", () => {
      for (const tokenSymbol in OFT_MESSENGERS) {
        const supportedChains = Object.keys(OFT_MESSENGERS[tokenSymbol]).map(
          Number
        );
        // Need at least two supported chains to form a route
        if (supportedChains.length < 2) continue;

        for (
          let originIndex = 0;
          originIndex < supportedChains.length;
          originIndex++
        ) {
          for (
            let destinationIndex = originIndex + 1;
            destinationIndex < supportedChains.length;
            destinationIndex++
          ) {
            const params = {
              inputToken: {
                symbol: tokenSymbol,
                chainId: supportedChains[originIndex],
                address: "0x1",
                decimals: 18,
              },
              outputToken: {
                symbol: tokenSymbol,
                chainId: supportedChains[destinationIndex],
                address: "0x1",
                decimals: 18,
              },
            };
            expect(isRouteSupported(params)).toBe(true);
          }
        }
      }
    });

    it("should return false if tokens are different", () => {
      const tokenSymbols = Object.keys(OFT_MESSENGERS);
      // Need at least two supported tokens to form a route
      if (tokenSymbols.length < 2) return;

      const tokenA = tokenSymbols[0];
      const tokenB = tokenSymbols[1];
      const chainA = Number(Object.keys(OFT_MESSENGERS[tokenA])[0]);
      const chainB = Number(Object.keys(OFT_MESSENGERS[tokenB])[0]);

      const params = {
        inputToken: {
          symbol: tokenA,
          chainId: chainA,
          address: "0x1",
          decimals: 18,
        },
        outputToken: {
          symbol: tokenB,
          chainId: chainB,
          address: "0x2",
          decimals: 18,
        },
      };
      expect(isRouteSupported(params)).toBe(false);
    });

    it("should return false if origin chain is not supported", () => {
      for (const tokenSymbol in OFT_MESSENGERS) {
        const supportedChains = Object.keys(OFT_MESSENGERS[tokenSymbol]).map(
          Number
        );
        if (supportedChains.length === 0) continue;

        const supportedChain = supportedChains[0];
        const unsupportedChain = 99999; // A chain ID that is not in any list

        const params = {
          inputToken: {
            symbol: tokenSymbol,
            chainId: unsupportedChain,
            address: "0x1",
            decimals: 18,
          },
          outputToken: {
            symbol: tokenSymbol,
            chainId: supportedChain,
            address: "0x1",
            decimals: 18,
          },
        };
        expect(isRouteSupported(params)).toBe(false);
      }
    });

    it("should return true for supported routes to Hypercore", () => {
      for (const tokenSymbol in HYPEREVM_OFT_COMPOSER_ADDRESSES) {
        if (OFT_MESSENGERS[tokenSymbol]) {
          const supportedChains = Object.keys(OFT_MESSENGERS[tokenSymbol]).map(
            Number
          );
          // Needs at least one supported chain for the token symbol to form a route to Hypercore
          if (supportedChains.length === 0) continue;

          const supportedChain = supportedChains[0];
          const params = {
            inputToken: {
              symbol: tokenSymbol,
              chainId: supportedChain,
              address: "0x1",
              decimals: 18,
            },
            outputToken: {
              symbol: tokenSymbol,
              chainId: CHAIN_IDs.HYPERCORE,
              address: "0x1",
              decimals: 18,
            },
          };
          expect(isRouteSupported(params)).toBe(true);
        }
      }
    });

    it("should return false for unsupported routes to Hypercore", () => {
      const allOftSymbols = Object.keys(OFT_MESSENGERS);
      const hypercoreSymbols = Object.keys(HYPEREVM_OFT_COMPOSER_ADDRESSES);
      const unsupportedSymbol = allOftSymbols.find(
        (s) => !hypercoreSymbols.includes(s)
      );

      if (unsupportedSymbol) {
        const supportedChains = Object.keys(
          OFT_MESSENGERS[unsupportedSymbol]
        ).map(Number);
        if (supportedChains.length > 0) {
          const params = {
            inputToken: {
              symbol: unsupportedSymbol,
              chainId: supportedChains[0],
              address: "0x1",
              decimals: 18,
            },
            outputToken: {
              symbol: unsupportedSymbol,
              chainId: CHAIN_IDs.HYPERCORE,
              address: "0x1",
              decimals: 18,
            },
          };
          expect(isRouteSupported(params)).toBe(false);
        }
      }
    });
  });

  const arbitrumUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.ARBITRUM],
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.ARBITRUM,
  };

  const polygonUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.POLYGON],
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.POLYGON,
  };

  const hyperCoreUSDT: Token = {
    address: TOKEN_SYMBOLS_MAP["USDT-SPOT"].addresses[CHAIN_IDs.HYPERCORE],
    symbol: "USDT-SPOT",
    decimals: 8,
    chainId: CHAIN_IDs.HYPERCORE,
  };

  const unsupportedToken: Token = {
    address: "0x123",
    symbol: "UNSUPPORTED",
    decimals: 18,
    chainId: CHAIN_IDs.ARBITRUM,
  };

  describe("getOftCrossSwapTypes", () => {
    it("should return BRIDGEABLE_TO_BRIDGEABLE if route is supported", () => {
      const result = getOftCrossSwapTypes({
        inputToken: arbitrumUSDT,
        outputToken: polygonUSDT,
        isInputNative: false,
        isOutputNative: false,
      });

      expect(result).toEqual([CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]);
    });

    it("should return BRIDGEABLE_TO_BRIDGEABLE if route is supported", () => {
      const result = getOftCrossSwapTypes({
        inputToken: polygonUSDT,
        outputToken: hyperCoreUSDT,
        isInputNative: false,
        isOutputNative: false,
      });

      expect(result).toEqual([CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE]);
    });

    it("should return an empty array if route is not supported", () => {
      const result = getOftCrossSwapTypes({
        inputToken: arbitrumUSDT,
        outputToken: unsupportedToken,
        isInputNative: false,
        isOutputNative: false,
      });

      expect(result).toEqual([]);
    });
  });

  describe("getRequiredDVNCount", () => {
    it("should return the DVN count for a valid route", async () => {
      expect(
        await getRequiredDVNCount(CHAIN_IDs.ARBITRUM, CHAIN_IDs.POLYGON, "USDT")
      ).toBeGreaterThan(0);

      expect(
        await getRequiredDVNCount(
          CHAIN_IDs.ARBITRUM,
          CHAIN_IDs.HYPERCORE,
          "USDT"
        )
      ).toBeGreaterThan(0);
    }, 30000);
  });

  describe("getQuote", () => {
    it("should return a valid quote", async () => {
      let result = await getQuote({
        inputToken: arbitrumUSDT,
        outputToken: polygonUSDT,
        inputAmount: BigNumber.from(1000),
        recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      });

      expect(result.inputAmount).toEqual(BigNumber.from(1000));
      expect(result.outputAmount).toBeDefined();
      expect(result.nativeFee).toBeDefined();
      expect(result.oftFeeAmount).toBeDefined();

      result = await getQuote({
        inputToken: arbitrumUSDT,
        outputToken: hyperCoreUSDT,
        inputAmount: BigNumber.from(1000),
        recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      });

      expect(result.inputAmount).toEqual(BigNumber.from(1000));
      expect(result.outputAmount).toBeDefined();
      expect(result.nativeFee).toBeDefined();
      expect(result.oftFeeAmount).toBeDefined();
    }, 30000);
  });

  describe("getEstimatedFillTime", () => {
    it("should calculate the estimated fill time correctly", async () => {
      expect(
        await getEstimatedFillTime(
          CHAIN_IDs.ARBITRUM,
          CHAIN_IDs.POLYGON,
          "USDT"
        )
      ).toBeGreaterThan(0);

      expect(
        await getEstimatedFillTime(
          CHAIN_IDs.ARBITRUM,
          CHAIN_IDs.HYPERCORE,
          "USDT"
        )
      ).toBeGreaterThan(0);
    });
  });

  describe("getOftQuoteForExactInput", () => {
    it("should return a valid quote for an exact input amount", async () => {
      let result = await getOftQuoteForExactInput({
        inputToken: arbitrumUSDT,
        outputToken: polygonUSDT,
        exactInputAmount: BigNumber.from(1000),
        recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      });

      expect(result.bridgeQuote.inputAmount).toEqual(BigNumber.from(1000));
      expect(result.bridgeQuote.outputAmount).toBeDefined();
      expect(result.bridgeQuote.minOutputAmount).toBeDefined();
      expect(result.bridgeQuote.estimatedFillTimeSec).toBeGreaterThan(0);
      expect(result.bridgeQuote.provider).toBe("oft");

      result = await getOftQuoteForExactInput({
        inputToken: arbitrumUSDT,
        outputToken: hyperCoreUSDT,
        exactInputAmount: BigNumber.from(1000),
        recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
      });

      expect(result.bridgeQuote.inputAmount).toEqual(BigNumber.from(1000));
      expect(result.bridgeQuote.outputAmount).toBeDefined();
      expect(result.bridgeQuote.minOutputAmount).toBeDefined();
      expect(result.bridgeQuote.estimatedFillTimeSec).toBeGreaterThan(0);
      expect(result.bridgeQuote.provider).toBe("oft");
    }, 30000);
  });

  describe("buildOftTx", () => {
    it("should build a valid transaction", async () => {
      const quotes: CrossSwapQuotes = {
        crossSwap: {
          amount: BigNumber.from("0x0f4240"),
          inputToken: {
            decimals: 6,
            symbol: "USDT",
            address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            chainId: 42161,
          },
          outputToken: {
            decimals: 8,
            symbol: "USDT-SPOT",
            address: "0x200000000000000000000000000000000000010C",
            chainId: 1337,
          },
          depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
          recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
          slippageTolerance: 1,
          type: "minOutput",
          refundOnOrigin: true,
          isInputNative: false,
          isOutputNative: false,
          embeddedActions: [],
          strictTradeType: true,
          isDestinationSvm: false,
          isOriginSvm: false,
        },
        bridgeQuote: {
          inputToken: {
            decimals: 6,
            symbol: "USDT",
            address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            chainId: 42161,
          },
          outputToken: {
            decimals: 8,
            symbol: "USDT-SPOT",
            address: "0x200000000000000000000000000000000000010C",
            chainId: 1337,
          },
          inputAmount: BigNumber.from("0x2710"),
          outputAmount: BigNumber.from("0x0f4240"),
          minOutputAmount: BigNumber.from("0x0f4240"),
          estimatedFillTimeSec: 24,
          provider: "oft",
          fees: {
            totalRelay: {
              pct: BigNumber.from("0x00"),
              total: BigNumber.from("0x00"),
              token: {
                decimals: 6,
                symbol: "USDT",
                address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                chainId: 42161,
              },
            },
            relayerCapital: {
              pct: BigNumber.from("0x00"),
              total: BigNumber.from("0x00"),
              token: {
                decimals: 6,
                symbol: "USDT",
                address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                chainId: 42161,
              },
            },
            relayerGas: {
              pct: BigNumber.from("0x00"),
              total: BigNumber.from("0x00"),
              token: {
                decimals: 6,
                symbol: "USDT",
                address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                chainId: 42161,
              },
            },
            lp: {
              pct: BigNumber.from("0x00"),
              total: BigNumber.from("0x00"),
              token: {
                decimals: 6,
                symbol: "USDT",
                address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                chainId: 42161,
              },
            },
            bridgeFee: {
              pct: BigNumber.from("0x00"),
              total: BigNumber.from("0x1522fe82c8c1"),
              token: {
                chainId: 42161,
                address: "0x0000000000000000000000000000000000000000",
                decimals: 18,
                symbol: "ETH",
              },
            },
          },
          message: "0x",
        },
        contracts: {
          depositEntryPoint: {
            name: "SpokePoolPeriphery",
            address: "0x89415a82d909a7238d69094C3Dd1dCC1aCbDa85C",
          },
        },
        appFee: {
          feeAmount: BigNumber.from("0x00"),
          feeToken: {
            decimals: 8,
            symbol: "USDT-SPOT",
            address: "0x200000000000000000000000000000000000010C",
            chainId: 1337,
          },
          feeActions: [],
        },
      };

      const result = await buildOftTx({ quotes });
      expect(result).toBeDefined();
      expect(result.chainId).toBe(42161);
      expect(result.data).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.from).toBe("0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D");
      expect(result.to).toBe("0x14E4A1B13bf7F943c8ff7C51fb60FA964A298D92");
      expect(result.ecosystem).toBe("evm");
    }, 30000);
  });
});
