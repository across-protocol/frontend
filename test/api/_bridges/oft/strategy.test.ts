import {
  getHyperLiquidComposerMessage,
  isRouteSupported,
  getOftCrossSwapTypes,
} from "../../../../api/_bridges/oft/strategy";
import {
  HYPEREVM_OFT_COMPOSER_ADDRESSES,
  OFT_MESSENGERS,
} from "../../../../api/_bridges/oft/utils/constants";
import { CHAIN_IDs } from "@across-protocol/constants";
import { Token } from "../../../../api/_dexes/types";
import { ethers } from "ethers";
import { CROSS_SWAP_TYPE } from "../../../../api/_dexes/utils";
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
});
