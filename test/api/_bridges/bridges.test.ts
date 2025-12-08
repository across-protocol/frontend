import { BigNumber } from "ethers";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../api/_constants";
import {
  getSupportedBridgeStrategies,
  getBridgeStrategy,
} from "../../../api/_bridges/index";
import * as bridgeUtils from "../../../api/_bridges/utils";
import { BridgeStrategyData } from "../../../api/_bridges/types";
import { Token } from "../../../api/_dexes/types";
import * as indexerApi from "../../../api/_indexer-api";

jest.mock("../../../api/_logger", () => ({
  getLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock("../../../api/_indexer-api", () => ({
  ...jest.requireActual("../../../api/_indexer-api"),
  getSponsorshipsFromIndexer: jest.fn().mockResolvedValue({
    totalSponsorships: [],
    userSponsorships: [],
    accountActivations: [],
  }),
}));

// Helper function to create a token on a specific chain
const createToken = (
  tokenSymbol: keyof typeof TOKEN_SYMBOLS_MAP,
  chainId: number
): Token => ({
  ...TOKEN_SYMBOLS_MAP[tokenSymbol],
  chainId,
  address: TOKEN_SYMBOLS_MAP[tokenSymbol].addresses[chainId],
});

const mockBridgeStrategyData = (
  overrides: Partial<BridgeStrategyData> = {}
): BridgeStrategyData => ({
  canFillInstantly: false,
  isUtilizationHigh: false,
  isUsdcToUsdc: false,
  isLargeCctpDeposit: false,
  isFastCctpEligible: false,
  isInThreshold: false,
  isUsdtToUsdt: false,
  isMonadTransfer: false,
  isWithinMonadLimit: false,
  ...overrides,
});

// Common test tokens
const usdcOptimism = createToken("USDC", CHAIN_IDs.OPTIMISM);
const usdcArbitrum = createToken("USDC", CHAIN_IDs.ARBITRUM);
const usdcMonad = createToken("USDC", CHAIN_IDs.MONAD);
const usdcPolygon = createToken("USDC", CHAIN_IDs.POLYGON);
const usdcBase = createToken("USDC", CHAIN_IDs.BASE);
const usdtMainnet = createToken("USDT", CHAIN_IDs.MAINNET);
const usdtArbitrum = createToken("USDT", CHAIN_IDs.ARBITRUM);
const usdtMonad = createToken("USDT", CHAIN_IDs.MONAD);
const wethOptimism = createToken("WETH", CHAIN_IDs.OPTIMISM);
const wethArbitrum = createToken("WETH", CHAIN_IDs.ARBITRUM);
const wethHyperEvm = createToken("WETH", CHAIN_IDs.HYPEREVM);
const wethHyperCore = createToken("WETH", CHAIN_IDs.HYPERCORE);
const usdhHyperEvm = createToken("USDH", CHAIN_IDs.HYPEREVM);

describe("api/_bridges/index", () => {
  const baseParams = {
    amount: BigNumber.from("1000000"), // 1 USDC
    amountType: "exactInput" as const,
    depositor: "0x1234567890123456789012345678901234567890",
    recipient: "0x1234567890123456789012345678901234567890",
  };

  describe("#getSupportedBridgeStrategies()", () => {
    describe("basic routing preference tests", () => {
      test("should return both across and cctp strategies for USDC with 'default' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          routingPreference: "default",
        });

        expect(result.length).toBe(2);
        expect(result.map((s) => s.name)).toEqual(
          expect.arrayContaining(["across", "cctp"])
        );
      });

      test("should return only across strategy for USDC with 'across' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          routingPreference: "across",
        });

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("across");
      });

      test("should return only cctp strategy for USDC with 'native' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          routingPreference: "native",
        });

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("cctp");
      });

      test("should return both across and oft strategies for USDT with 'default' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdtMainnet,
          outputToken: usdtArbitrum,
          routingPreference: "default",
        });

        expect(result.length).toBe(2);
        expect(result.map((s) => s.name)).toEqual(
          expect.arrayContaining(["across", "oft"])
        );
      });

      test("should return only oft strategy for USDT with 'native' routing preference", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: usdtMainnet,
          outputToken: usdtArbitrum,
          routingPreference: "native",
        });

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("oft");
      });

      test("should return only across strategy for non-USDC/USDT tokens", () => {
        const result = getSupportedBridgeStrategies({
          inputToken: wethOptimism,
          outputToken: wethArbitrum,
          routingPreference: "default",
        });

        expect(result.length).toBe(1);
        expect(result[0].name).toBe("across");
      });

      test("should fallback to Across when getBridgeStrategyData returns undefined", async () => {
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(undefined);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("across");
      });
    });
  });

  describe("#getBridgeStrategy()", () => {
    jest.mock("../../../api/_utils", () => ({
      ...jest.requireActual("../../../api/_utils"),
      getCachedLimits: jest.fn(),
    }));

    afterAll(() => {
      jest.clearAllMocks();
    });

    describe("Monad transfer routing", () => {
      test("should use Across for Monad transfers within 25K USD limit", async () => {
        const mockData = mockBridgeStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: true,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.MONAD,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcMonad,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("across");
      });

      test("should use OFT for Monad USDT transfers exceeding 25K USD limit", async () => {
        const mockData = mockBridgeStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: false,
          isUsdtToUsdt: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.MONAD,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdtMonad,
          outputToken: usdtArbitrum,
        });

        expect(strategy.name).toBe("oft");
      });

      test("should use Fast CCTP for Monad USDC transfers exceeding 25K USD limit", async () => {
        const mockData = mockBridgeStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: false,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.MONAD,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcMonad,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("cctp");
      });

      test("should use Across for Monad other token transfers exceeding 25K USD limit", async () => {
        const mockData = mockBridgeStrategyData({
          isMonadTransfer: true,
          isWithinMonadLimit: false,
          isUsdcToUsdc: false,
          isUsdtToUsdt: false,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: wethOptimism,
          outputToken: wethArbitrum,
        });

        expect(strategy.name).toBe("across");
      });
    });

    describe("High utilization routing", () => {
      test("should use CCTP when utilization is high for USDC transfers", async () => {
        const mockData = mockBridgeStrategyData({
          isUtilizationHigh: true,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("cctp");
      });

      test("should use OFT when utilization is high for USDT transfers", async () => {
        const mockData = mockBridgeStrategyData({
          isUtilizationHigh: true,
          isUsdtToUsdt: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.MAINNET,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdtMainnet,
          outputToken: usdtArbitrum,
        });

        expect(strategy.name).toBe("oft");
      });

      test("should use Across when utilization is high for non-USDC/USDT transfers", async () => {
        const mockData = mockBridgeStrategyData({
          isUtilizationHigh: true,
          isUsdcToUsdc: false,
          isUsdtToUsdt: false,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: wethOptimism,
          outputToken: wethArbitrum,
        });

        expect(strategy.name).toBe("across");
      });
    });

    describe("Fast CCTP eligible routing", () => {
      test("should use Across for Fast CCTP eligible transfers within 10K threshold", async () => {
        const mockData = mockBridgeStrategyData({
          isFastCctpEligible: true,
          isInThreshold: true,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.ARBITRUM,
          destinationChainId: CHAIN_IDs.POLYGON,
          inputToken: usdcArbitrum,
          outputToken: usdcPolygon,
        });

        expect(strategy.name).toBe("across");
      });

      test("should use Across for fast CCTP eligible large deposits", async () => {
        const mockData = mockBridgeStrategyData({
          isFastCctpEligible: true,
          isInThreshold: false,
          isLargeCctpDeposit: true,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.BASE,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcBase,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("across");
      });
    });

    describe("Instant fill routing", () => {
      test("should use Across when can fill instantly", async () => {
        const mockData = mockBridgeStrategyData({
          canFillInstantly: true,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("across");
      });

      test("should use Across when cannot fill instantly and is large deposit (USDC)", async () => {
        const mockData = mockBridgeStrategyData({
          canFillInstantly: false,
          isLargeCctpDeposit: true,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("across");
      });

      test("should use OFT when cannot fill instantly and is large deposit (USDT)", async () => {
        const mockData = mockBridgeStrategyData({
          canFillInstantly: false,
          isLargeCctpDeposit: true,
          isUsdcToUsdc: false,
          isUsdtToUsdt: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.MAINNET,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdtMainnet,
          outputToken: usdtArbitrum,
        });

        expect(strategy.name).toBe("oft");
      });

      test("should use CCTP when cannot fill instantly but is not large USDC deposit", async () => {
        const mockData = mockBridgeStrategyData({
          canFillInstantly: false,
          isLargeCctpDeposit: false,
          isUsdcToUsdc: true,
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
        });

        expect(strategy.name).toBe("cctp");
      });
    });

    describe("Chain and token pair overrides", () => {
      test("should use sponsored intent strategy for USDC to USDH on HyperEVM", async () => {
        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.BASE,
          destinationChainId: CHAIN_IDs.HYPEREVM,
          inputToken: usdcBase,
          outputToken: usdhHyperEvm,
        });

        expect(strategy.name).toBe("sponsored-intent");
      });

      test("should use hypercore strategy for HyperEVM to HyperCore transfers", async () => {
        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.HYPEREVM,
          destinationChainId: CHAIN_IDs.HYPERCORE,
          inputToken: wethHyperEvm,
          outputToken: wethHyperCore,
        });

        expect(strategy.name).toBe("hypercore");
      });

      test("should use hypercore strategy for HyperCore to HyperEVM transfers", async () => {
        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.HYPERCORE,
          destinationChainId: CHAIN_IDs.HYPEREVM,
          inputToken: wethHyperCore,
          outputToken: wethHyperEvm,
        });

        expect(strategy.name).toBe("hypercore");
      });
    });

    describe("Actions routing", () => {
      test("should use Across when actions are present for USDC transfers", async () => {
        const mockData = mockBridgeStrategyData({
          isUsdcToUsdc: true,
          isUtilizationHigh: true, // Even with high utilization
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.OPTIMISM,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdcOptimism,
          outputToken: usdcArbitrum,
          includesActions: true,
        });

        expect(strategy.name).toBe("across");
      });

      test("should use Across when actions are present for USDT transfers", async () => {
        const mockData = mockBridgeStrategyData({
          isUsdtToUsdt: true,
          isUtilizationHigh: true, // Even with high utilization
        });
        jest
          .spyOn(bridgeUtils, "getBridgeStrategyData")
          .mockResolvedValue(mockData);

        const strategy = await getBridgeStrategy({
          ...baseParams,
          originChainId: CHAIN_IDs.MAINNET,
          destinationChainId: CHAIN_IDs.ARBITRUM,
          inputToken: usdtMainnet,
          outputToken: usdtArbitrum,
          includesActions: true,
        });

        expect(strategy.name).toBe("across");
      });
    });
  });
});
