import { BigNumber } from "ethers";

import {
  isHyperEvmToHyperCoreRoute,
  getAmountToHyperCore,
} from "../../../../../api/_bridges/cctp/utils/hypercore";
import { CHAIN_IDs } from "../../../../../api/_constants";
import { TOKEN_SYMBOLS_MAP } from "../../../../../api/_constants";
import * as hypercoreModule from "../../../../../api/_hypercore";

jest.mock("../../../../../api/_hypercore");

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

      expect(mockAccountExistsOnHyperCore).toHaveBeenCalledWith({
        account: params.recipient,
      });
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

      expect(mockAccountExistsOnHyperCore).toHaveBeenCalledWith({
        account: params.recipient,
      });
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

      expect(mockAccountExistsOnHyperCore).toHaveBeenCalledWith({
        account: params.recipient,
      });
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

      expect(mockAccountExistsOnHyperCore).toHaveBeenCalledWith({
        account: params.recipient,
      });
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

      expect(mockAccountExistsOnHyperCore).toHaveBeenCalledWith({
        account: params.recipient,
      });
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

      expect(mockAccountExistsOnHyperCore).toHaveBeenCalledWith({
        account: params.recipient,
      });
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
});
