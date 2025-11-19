import { BigNumber } from "ethers";
import axios from "axios";

import {
  isHyperEvmToHyperCoreRoute,
  getAmountToHyperCore,
  getCctpFees,
} from "../../../../../api/_bridges/cctp/utils/hypercore";
import { CHAIN_IDs } from "../../../../../api/_constants";
import { TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";
import * as hypercoreModule from "../../../../../api/_hypercore";

jest.mock("../../../../../api/_hypercore");
jest.mock("axios");

describe("bridges/cctp/utils/hypercore", () => {
  const mockAccountExistsOnHyperCore =
    hypercoreModule.accountExistsOnHyperCore as jest.MockedFunction<
      typeof hypercoreModule.accountExistsOnHyperCore
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("#getAmountToHyperCore()", () => {
    const inputToken = {
      ...TOKEN_SYMBOLS_MAP.USDC,
      address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
      chainId: CHAIN_IDs.HYPEREVM,
    };

    const outputToken = {
      ...TOKEN_SYMBOLS_MAP.USDC,
      address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
      chainId: CHAIN_IDs.HYPERCORE,
    };

    test("should throw error if recipient is not provided", async () => {
      const params = {
        inputToken,
        outputToken,
        inputOrOutput: "input" as const,
        amount: BigNumber.from(1_000_000),
      };

      await expect(getAmountToHyperCore(params)).rejects.toThrow(
        "CCTP: Recipient is not provided"
      );
    });

    test("should return correct output amount when recipient exists (input mode)", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(true);

      const params = {
        inputToken,
        outputToken,
        inputOrOutput: "input" as const,
        amount: BigNumber.from(1_000_000),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const result = await getAmountToHyperCore(params);
      expect(result).toEqual(params.amount); // Same amount, same decimals
    });

    test("should return correct input amount when recipient exists (output mode)", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(true);

      const params = {
        inputToken,
        outputToken,
        inputOrOutput: "output" as const,
        amount: BigNumber.from(2_000_000),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const result = await getAmountToHyperCore(params);
      expect(result).toEqual(params.amount); // Same amount, same decimals
    });

    test("should subtract account creation fee when recipient doesn't exist (input mode)", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(false);

      const params = {
        inputToken,
        outputToken,
        inputOrOutput: "input" as const,
        amount: BigNumber.from(10_000_000),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const outputAmount = await getAmountToHyperCore(params);
      // Should be 10 - 1 = 9 USDC (9000000)
      expect(outputAmount.toNumber()).toEqual(9_000_000);
    });

    test("should add account creation fee when recipient doesn't exist (output mode)", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(false);

      const params = {
        inputToken,
        outputToken,
        inputOrOutput: "output" as const,
        amount: BigNumber.from(5_000_000),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const inputAmount = await getAmountToHyperCore(params);
      // Should be 5 + 1 = 6 USDC (6000000)
      expect(inputAmount.toNumber()).toEqual(6_000_000);
    });

    test("should throw error if account creation fee is greater than input amount", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(false);

      const params = {
        inputToken,
        outputToken,
        inputOrOutput: "input" as const,
        amount: BigNumber.from(500_000), // 0.5 USDC (less than 1 USDC fee)
        recipient: "0x1234567890123456789012345678901234567890",
      };

      await expect(getAmountToHyperCore(params)).rejects.toThrow(
        "CCTP: Amount must exceed account creation fee"
      );
    });

    test("should handle different token decimals when recipient exists", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(true);

      // This case might happen when CCTP supports USDC-SPOT
      const outputTokenWith8Decimals = {
        ...outputToken,
        decimals: 8,
      };

      const params = {
        inputToken,
        outputToken: outputTokenWith8Decimals,
        inputOrOutput: "input" as const,
        amount: BigNumber.from(1_000_000),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const outputAmount = await getAmountToHyperCore(params);
      expect(outputAmount.toNumber()).toEqual(100_000_000);
    });

    test("should handle different token decimals when recipient doesn't exist (input mode)", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(false);

      // This case might happen when CCTP supports USDC-SPOT
      const outputTokenWith8Decimals = {
        ...outputToken,
        decimals: 8,
      };

      const params = {
        inputToken,
        outputToken: outputTokenWith8Decimals,
        inputOrOutput: "input" as const,
        amount: BigNumber.from(10_000_000),
        recipient: "0x1234567890123456789012345678901234567890",
      };

      const outputAmount = await getAmountToHyperCore(params);
      expect(outputAmount.toNumber()).toEqual(900_000_000);
    });
  });

  describe("#isHyperEvmToHyperCoreRoute()", () => {
    test("should return true for HyperEVM -> HyperCore", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
          chainId: CHAIN_IDs.HYPEREVM,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
          chainId: CHAIN_IDs.HYPERCORE,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(true);
    });

    test("should return true for HyperEVM Testnet -> HyperCore Testnet", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM_TESTNET],
          chainId: CHAIN_IDs.HYPEREVM_TESTNET,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address:
            TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE_TESTNET],
          chainId: CHAIN_IDs.HYPERCORE_TESTNET,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(true);
    });

    test("should return false for HyperCore -> HyperEVM", () => {
      const params = {
        inputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
          chainId: CHAIN_IDs.HYPERCORE,
        },
        outputToken: {
          ...TOKEN_SYMBOLS_MAP.USDC,
          address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPEREVM],
          chainId: CHAIN_IDs.HYPEREVM,
        },
      };
      const isRouteSupported = isHyperEvmToHyperCoreRoute(params);
      expect(isRouteSupported).toEqual(false);
    });
  });

  describe("#getCctpFees()", () => {
    const mockAxios = axios as jest.Mocked<typeof axios>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Mock Circle API response with multiple finality threshold configs
    const mockCctpFeeResponse = [
      {
        finalityThreshold: 1000, // fast
        minimumFee: 1, // 1 bps = 0.01%
        forwardFee: {
          low: 100000,
          med: 200000, // 0.2 USDC (in 6 decimals)
          high: 300000,
        },
      },
      {
        finalityThreshold: 2000, // standard
        minimumFee: 2, // 2 bps = 0.02%
        forwardFee: {
          low: 150000,
          med: 250000, // 0.25 USDC
          high: 350000,
        },
      },
    ];

    describe("HyperCore destinations (mainnet)", () => {
      const inputToken = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
        chainId: CHAIN_IDs.BASE,
      };

      const outputTokenHyperCore = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
        chainId: CHAIN_IDs.HYPERCORE,
      };

      test("should query with forward=true and extract forward fee from API response", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        const result = await getCctpFees({
          inputToken,
          outputToken: outputTokenHyperCore,
          minFinalityThreshold: 1000,
        });

        // Verify API call parameters
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining("iris-api.circle.com/v2/burn/USDC/fees/"),
          expect.objectContaining({
            params: { forward: true },
          })
        );

        // Verify returned fee breakdown
        expect(result.transferFeeBps).toEqual(1);
        expect(result.forwardFee).toEqual(BigNumber.from(200000));
      });

      test("should throw error when config for finality threshold is not found", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        await expect(
          getCctpFees({
            inputToken,
            outputToken: outputTokenHyperCore,
            minFinalityThreshold: 999, // Non-existent threshold
          })
        ).rejects.toThrow(
          "Fee configuration not found for finality threshold 999 in CCTP fee response"
        );
      });
    });

    describe("HyperCore destinations (testnet)", () => {
      const inputToken = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE_SEPOLIA],
        chainId: CHAIN_IDs.BASE_SEPOLIA,
      };

      const outputTokenHyperCoreTestnet = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE_TESTNET],
        chainId: CHAIN_IDs.HYPERCORE_TESTNET,
      };

      test("should use sandbox endpoint for testnet and extract forward fee", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        const result = await getCctpFees({
          inputToken,
          outputToken: outputTokenHyperCoreTestnet,
          minFinalityThreshold: 1000,
        });

        // Verify sandbox endpoint is used
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining(
            "iris-api-sandbox.circle.com/v2/burn/USDC/fees/"
          ),
          expect.objectContaining({
            params: { forward: true },
          })
        );

        // Verify forward fee is extracted
        expect(result.transferFeeBps).toEqual(1);
        expect(result.forwardFee).toEqual(BigNumber.from(200000));
      });
    });

    describe("Non-HyperCore destinations", () => {
      const inputToken = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
        chainId: CHAIN_IDs.BASE,
      };

      const outputTokenBase = {
        ...TOKEN_SYMBOLS_MAP.USDC,
        address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
        chainId: CHAIN_IDs.OPTIMISM,
      };

      test("should query without forward parameter and set forwardFee to 0", async () => {
        mockAxios.get.mockResolvedValue({ data: mockCctpFeeResponse });

        const result = await getCctpFees({
          inputToken,
          outputToken: outputTokenBase,
          minFinalityThreshold: 2000,
        });

        // Verify API call does NOT include forward parameter
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining("iris-api.circle.com/v2/burn/USDC/fees/"),
          expect.objectContaining({
            params: undefined,
          })
        );

        // Verify forward fee is 0
        expect(result.transferFeeBps).toEqual(2);
        expect(result.forwardFee).toEqual(BigNumber.from(0));
      });
    });
  });
});
