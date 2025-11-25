import {
  getQuote,
  getEstimatedFillTime,
  getOftQuoteForExactInput,
  getRequiredDVNCount,
  buildOftTx,
} from "../../../api/_bridges/oft/strategy";
import { CHAIN_IDs } from "@across-protocol/constants";
import { CrossSwapQuotes, Token } from "../../../api/_dexes/types";
import { BigNumber } from "ethers";
import { TOKEN_SYMBOLS_MAP } from "../../../api/_constants";

describe("OFT Strategy", () => {
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
    it("should return a valid quote from Arbitrum to Polygon", async () => {
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

    it("should return a valid quote from Arbitrum to Hyperlane", async () => {
      const result = await getQuote({
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
    }, 30000);
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
      /**
       * NOTE: This test uses values and specific token addresses from a real,
       * successful cross-chain transaction to Hyperliquid's Composer contract.
       *
       * REASONING:
       * 1. These values were captured from an actual API quote that successfully completed
       *    an on-chain cross-chain transfer using the Hyperliquid Composer contract.
       * 3. The specific token addresses and chain IDs represent the real Arbitrum USDT to
       *    HyperCore USDT-SPOT route that was validated on-chain.
       * 4. Since CI tests cannot verify the actual cross-chain transfer completion, maintaining
       *    the exact request structure from a known-working transaction provides the highest
       *    confidence that buildOftTx produces valid transaction data.
       * 5. The Hyperliquid Composer integration uses a very specific `extraOptions` format
       *    (see strategy.ts for details), and any deviation in the request structure could
       *    potentially result in a transaction that builds successfully but fails on-chain.
       *
       */
      const quotes: CrossSwapQuotes = {
        crossSwap: {
          amount: BigNumber.from(1000000),
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
          inputAmount: BigNumber.from(10000),
          outputAmount: BigNumber.from(1000000),
          minOutputAmount: BigNumber.from(1000000),
          estimatedFillTimeSec: 24,
          provider: "oft",
          fees: {
            pct: BigNumber.from(0),
            amount: BigNumber.from("0x1522fe82c8c1"),
            token: {
              chainId: 42161,
              address: "0x0000000000000000000000000000000000000000",
              decimals: 18,
              symbol: "ETH",
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
          feeAmount: BigNumber.from(0),
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
