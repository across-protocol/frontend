import { BigNumber } from "ethers";
import axios from "axios";

import { getCctpBridgeStrategy } from "../../../../api/_bridges/cctp/strategy";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";
import * as hypercoreModule from "../../../../api/_hypercore";

jest.mock("axios");
jest.mock("../../../../api/_hypercore");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("bridges/cctp/strategy", () => {
  const mockAccountExistsOnHyperCore =
    hypercoreModule.accountExistsOnHyperCore as jest.MockedFunction<
      typeof hypercoreModule.accountExistsOnHyperCore
    >;

  const strategy = getCctpBridgeStrategy();

  // Shared test tokens
  const inputToken = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    chainId: CHAIN_IDs.ARBITRUM,
    decimals: 6,
  };

  const outputTokenHyperCore = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.HYPERCORE],
    chainId: CHAIN_IDs.HYPERCORE,
    decimals: 6,
  };

  const outputTokenBase = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
    chainId: CHAIN_IDs.BASE,
    decimals: 6,
  };

  // Shared mock CCTP fee response
  const mockCctpFeeResponse = [
    {
      finalityThreshold: 1000,
      minimumFee: 1, // 1 bps = 0.01%
      forwardFee: {
        low: 100000,
        med: 200000, // 0.2 USDC (in 6 decimals)
        high: 300000,
      },
    },
    {
      finalityThreshold: 2000,
      minimumFee: 0,
      forwardFee: {
        low: 0,
        med: 0,
        high: 0,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: mockCctpFeeResponse,
    });
  });

  describe("getQuoteForExactInput()", () => {
    test("should calculate correct output amount for existing HyperCore account", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(true);

      const exactInputAmount = BigNumber.from(100_000_000); // 100 USDC
      const recipient = "0x1234567890123456789012345678901234567890";

      const result = await strategy.getQuoteForExactInput({
        inputToken,
        outputToken: outputTokenHyperCore,
        exactInputAmount,
        recipient,
      });

      // Expected calculation:
      // Step 1: Calculate CCTP fees
      //   transferFee = 100 * 1 / 10000 = 0.01 USDC = 10,000
      //   maxFee = 10,000 + 200,000 = 210,000
      // Step 2: Calculate amount after fees
      //   inputAfterFee = 100,000,000 - 210,000 = 99,790,000
      // Step 3: No account creation fee (account exists)
      //   outputAmount = 99,790,000

      const transferFee = exactInputAmount.mul(1).div(10000); // 10,000
      const maxFee = transferFee.add(200_000); // 210,000
      const inputAfterFee = exactInputAmount.sub(maxFee); // 99,790,000

      expect(result.bridgeQuote.inputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.outputAmount).toEqual(inputAfterFee);
      expect(result.bridgeQuote.minOutputAmount).toEqual(inputAfterFee);
      expect(result.bridgeQuote.fees.bridgeFee.total).toEqual(maxFee);
    });

    test("should calculate correct output amount for new HyperCore account", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(false);

      const exactInputAmount = BigNumber.from(100_000_000); // 100 USDC
      const recipient = "0x1234567890123456789012345678901234567890";

      const result = await strategy.getQuoteForExactInput({
        inputToken,
        outputToken: outputTokenHyperCore,
        exactInputAmount,
        recipient,
      });

      // Expected calculation:
      // Step 1: Calculate CCTP fees
      //   transferFee = 100 * 1 / 10000 = 0.01 USDC = 10,000
      //   maxFee = 10,000 + 200,000 = 210,000
      // Step 2: Calculate amount after fees
      //   inputAfterFee = 100,000,000 - 210,000 = 99,790,000
      // Step 3: Account creation fee (new account)
      //   outputAmount = 99,790,000 - 1,000,000 = 98,790,000

      const transferFee = exactInputAmount.mul(1).div(10000); // 10,000
      const maxFee = transferFee.add(200_000); // 210,000
      const inputAfterFee = exactInputAmount.sub(maxFee); // 99,790,000
      const expectedOutput = inputAfterFee.sub(1_000_000); // 98,790,000 (minus 1 USDC account fee)

      expect(result.bridgeQuote.inputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.outputAmount).toEqual(expectedOutput);
      expect(result.bridgeQuote.minOutputAmount).toEqual(expectedOutput);
      expect(result.bridgeQuote.fees.bridgeFee.total).toEqual(maxFee);
    });

    test("should calculate correct output amount for non-HyperCore route with zero fees", async () => {
      const exactInputAmount = BigNumber.from(100_000_000); // 100 USDC

      const result = await strategy.getQuoteForExactInput({
        inputToken,
        outputToken: outputTokenBase,
        exactInputAmount,
      });

      // Expected calculation:
      // Non-HyperCore routes currently have no CCTP fees
      // outputAmount = inputAmount (no fees, no account creation)

      expect(result.bridgeQuote.inputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.outputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.fees.bridgeFee.total).toEqual(
        BigNumber.from(0)
      );
    });
  });

  describe("getQuoteForOutput()", () => {
    test("should calculate correct input amount for existing HyperCore account", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(true);

      const minOutputAmount = BigNumber.from(100_000_000); // 100 USDC
      const recipient = "0x1234567890123456789012345678901234567890";

      const result = await strategy.getQuoteForOutput({
        inputToken,
        outputToken: outputTokenHyperCore,
        minOutputAmount,
        recipient,
      });

      // Expected calculation:
      // Step 1: amountToArriveOnDestination = 100 USDC (no account creation fee)
      // Step 2: Solve algebraic formula
      //   inputAmount = (100 + 0.2) * 10000 / (10000 - 1)
      //   inputAmount = 100.2 * 10000 / 9999
      //   inputAmount = 100,200,000 / 9999 ≈ 100,210,021

      const expectedInputAmount = BigNumber.from(100_000_000)
        .add(200_000)
        .mul(10000)
        .div(9999);

      expect(result.bridgeQuote.inputAmount).toEqual(expectedInputAmount);
      expect(result.bridgeQuote.outputAmount).toEqual(minOutputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(minOutputAmount);

      // Verify CCTP fee = inputAmount - amountToArriveOnDestination
      const expectedFee = expectedInputAmount.sub(100_000_000);
      expect(result.bridgeQuote.fees.bridgeFee.total).toEqual(expectedFee);
    });

    test("should calculate correct input amount for new HyperCore account", async () => {
      mockAccountExistsOnHyperCore.mockResolvedValue(false);

      const minOutputAmount = BigNumber.from(100_000_000); // 100 USDC
      const recipient = "0x1234567890123456789012345678901234567890";

      const result = await strategy.getQuoteForOutput({
        inputToken,
        outputToken: outputTokenHyperCore,
        minOutputAmount,
        recipient,
      });

      // Expected calculation:
      // Step 1: amountToArriveOnDestination = 100 + 1 = 101 USDC (with account creation fee)
      // Step 2: Solve algebraic formula
      //   inputAmount = (101 + 0.2) * 10000 / (10000 - 1)
      //   inputAmount = 101.2 * 10000 / 9999
      //   inputAmount = 101,200,000 / 9999 ≈ 101,210,121

      const amountToArriveOnDestination = BigNumber.from(101_000_000); // 100 + 1 USDC
      const expectedInputAmount = amountToArriveOnDestination
        .add(200_000)
        .mul(10000)
        .div(9999);

      expect(result.bridgeQuote.inputAmount).toEqual(expectedInputAmount);
      expect(result.bridgeQuote.outputAmount).toEqual(minOutputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(minOutputAmount);

      // Verify CCTP fee = inputAmount - amountToArriveOnDestination
      const expectedFee = expectedInputAmount.sub(amountToArriveOnDestination);
      expect(result.bridgeQuote.fees.bridgeFee.total).toEqual(expectedFee);
    });
  });
});
