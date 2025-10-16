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
  HYPERCORE_OFT_COMPOSER_ADDRESSES,
  OFT_MESSENGERS,
} from "../../../../api/_bridges/oft/utils/constants";
import { CHAIN_IDs } from "@across-protocol/constants";
import { Token } from "../../../../api/_dexes/types";
import { ethers, BigNumber } from "ethers";
import { CROSS_SWAP_TYPE } from "../../../../api/_dexes/utils";
import { getRpcUrlsFromConfigJson } from "../../../../api/_providers";

describe("OFT Strategy", () => {
  beforeAll(() => {
    const arbitrumRpcs = getRpcUrlsFromConfigJson(CHAIN_IDs.ARBITRUM);
    const polygonRpcs = getRpcUrlsFromConfigJson(CHAIN_IDs.POLYGON);

    if (arbitrumRpcs.length === 0) {
      console.warn(
        "Skipping OFT Strategy tests: No RPC URL found for Arbitrum"
      );
      return;
    }

    if (polygonRpcs.length === 0) {
      console.warn("Skipping OFT Strategy tests: No RPC URL found for Polygon");
      return;
    }
  });
  describe("getHyperLiquidComposerMessage", () => {
    const recipient = "0x0000000000000000000000000000000000000001";
    const tokenSymbol = "USDT";

    it("should return the correct message for HyperLiquid", () => {
      const { composeMsg, toAddress, extraOptions } =
        getHyperLiquidComposerMessage(recipient, tokenSymbol);

      const expectedComposeMsg = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address"],
        [0, recipient]
      );

      expect(composeMsg).toBe(expectedComposeMsg);
      expect(toAddress).toBe(HYPERCORE_OFT_COMPOSER_ADDRESSES[tokenSymbol]);
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
        if (supportedChains.length < 2) continue;

        for (
          let originIndex = 0;
          originIndex < supportedChains.length;
          originIndex++
        ) {
          for (
            let destinationIndex = i + 1;
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
      for (const tokenSymbol in HYPERCORE_OFT_COMPOSER_ADDRESSES) {
        if (OFT_MESSENGERS[tokenSymbol]) {
          const supportedChains = Object.keys(OFT_MESSENGERS[tokenSymbol]).map(
            Number
          );
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
      const hypercoreSymbols = Object.keys(HYPERCORE_OFT_COMPOSER_ADDRESSES);
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
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.ARBITRUM,
  };

  const polygonUSDT: Token = {
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    symbol: "USDT",
    decimals: 6,
    chainId: CHAIN_IDs.POLYGON,
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
      const dvnCount = await getRequiredDVNCount(
        CHAIN_IDs.ARBITRUM,
        CHAIN_IDs.POLYGON,
        "USDT"
      );
      expect(dvnCount).toBeGreaterThan(0);
    }, 30000);
  });

  describe("getQuote", () => {
    it("should return a valid quote", async () => {
      const result = await getQuote({
        inputToken: arbitrumUSDT,
        outputToken: polygonUSDT,
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
      const result = await getEstimatedFillTime(
        CHAIN_IDs.ARBITRUM,
        CHAIN_IDs.POLYGON,
        "USDT"
      );
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("getOftQuoteForExactInput", () => {
    it("should return a valid quote for an exact input amount", async () => {
      const result = await getOftQuoteForExactInput({
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
    }, 30000);
  });

  describe("buildOftTx", () => {
    it("should build a valid transaction", async () => {
      const quotes = {
        crossSwap: {
          amount: {
            type: "BigNumber",
            hex: "0x0f4240",
          },
          inputToken: {
            decimals: 6,
            symbol: "USDT",
            address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
            name: "Tether USD",
            chainId: 42161,
          },
          outputToken: {
            decimals: 6,
            symbol: "USDT",
            address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
            name: "Tether USD",
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
            name: "Tether USD",
            chainId: 42161,
          },
          outputToken: {
            decimals: 6,
            symbol: "USDT",
            address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
            name: "Tether USD",
            chainId: 1337,
          },
          inputAmount: BigNumber.from("0x0f4240"),
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
                name: "Tether USD",
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
                name: "Tether USD",
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
                name: "Tether USD",
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
                name: "Tether USD",
                chainId: 42161,
              },
            },
            bridgeFee: {
              pct: BigNumber.from("0x00"),
              total: BigNumber.from("0x9fbde11cfaf7"),
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
            decimals: 6,
            symbol: "USDT",
            address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
            name: "Tether USD",
            chainId: 1337,
          },
          feeActions: [],
        },
      } as any;

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
