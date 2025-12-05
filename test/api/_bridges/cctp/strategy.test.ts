import { BigNumber } from "ethers";
import axios from "axios";
import * as sdk from "@across-protocol/sdk";

import {
  getCctpBridgeStrategy,
  _buildCctpTxForAllowanceHolderEvm,
} from "../../../../api/_bridges/cctp/strategy";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";
import { CrossSwapQuotes } from "../../../../api/_dexes/types";
import * as hypercoreModule from "../../../../api/_hypercore";

// Mock all dependencies
jest.mock("axios");

// Only mock subset of functions we need
jest.mock("../../../../api/_hypercore", () => {
  const actual = jest.requireActual("../../../../api/_hypercore");
  return {
    ...actual,
    accountExistsOnHyperCore: jest.fn(),
  };
});

// Mock SDK - only the SVM utilities we need
jest.mock("@across-protocol/sdk", () => {
  const actual = jest.requireActual("@across-protocol/sdk");
  return {
    ...actual,
    arch: {
      ...actual.arch,
      svm: {
        getAssociatedTokenAddress: jest.fn(),
      },
    },
  };
});

// Mock only the specific functions we need to mock
jest.mock("../../../../api/_bridges/cctp/utils/constants", () => {
  const actual = jest.requireActual(
    "../../../../api/_bridges/cctp/utils/constants"
  );
  return {
    ...actual,
    encodeDepositForBurn: jest.fn(
      (params) => `0xencoded-mintRecipient:${params.mintRecipient}`
    ),
  };
});

jest.mock("../../../../api/_integrator-id", () => ({
  tagSwapApiMarker: jest.fn((data) => data),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("bridges/cctp/strategy", () => {
  const mockAccountExistsOnHyperCore =
    hypercoreModule.accountExistsOnHyperCore as jest.MockedFunction<
      typeof hypercoreModule.accountExistsOnHyperCore
    >;

  // Default transfer mode is "fast"
  const strategy = getCctpBridgeStrategy("fast");
  const strategyStandard = getCctpBridgeStrategy("standard");

  // Shared test tokens
  const inputToken = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.ARBITRUM],
    chainId: CHAIN_IDs.ARBITRUM,
    decimals: 6,
  };

  const outputTokenHyperCore = {
    ...TOKEN_SYMBOLS_MAP["USDC"],
    address: TOKEN_SYMBOLS_MAP["USDC"].addresses[CHAIN_IDs.HYPERCORE],
    chainId: CHAIN_IDs.HYPERCORE,
  };

  const outputTokenBase = {
    ...TOKEN_SYMBOLS_MAP.USDC,
    address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
    chainId: CHAIN_IDs.BASE,
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
      expect(result.bridgeQuote.fees.amount).toEqual(maxFee);
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
      expect(result.bridgeQuote.fees.amount).toEqual(maxFee);
    });

    test("should calculate correct output amount for non-HyperCore route with zero fees", async () => {
      const exactInputAmount = BigNumber.from(100_000_000); // 100 USDC

      const result = await strategyStandard.getQuoteForExactInput({
        inputToken,
        outputToken: outputTokenBase,
        exactInputAmount,
        recipient: "0x1234567890123456789012345678901234567890",
      });

      // Expected calculation:
      // Non-HyperCore routes currently have no CCTP fees
      // outputAmount = inputAmount (no fees, no account creation)

      expect(result.bridgeQuote.inputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.outputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.minOutputAmount).toEqual(exactInputAmount);
      expect(result.bridgeQuote.fees.amount).toEqual(BigNumber.from(0));
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
      expect(result.bridgeQuote.fees.amount).toEqual(expectedFee);
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
      expect(result.bridgeQuote.fees.amount).toEqual(expectedFee);
    });
  });

  describe("buildTxForAllowanceHolder() - EVM to Solana", () => {
    it("should derive recipient token account when destination is Solana", async () => {
      // Set up test data
      const solanaRecipient = "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t";
      const solanaTokenAccount = "5fE2vJ4f41PgDWyR2HFdKcYRuckFX8PwKH2kL7jPU6TC";

      // Mock the getAssociatedTokenAddress function to return the test token account
      (sdk.arch.svm.getAssociatedTokenAddress as jest.Mock).mockResolvedValue(
        solanaTokenAccount
      );

      const quotes: CrossSwapQuotes = {
        crossSwap: {
          amount: BigNumber.from("1000000"),
          inputToken: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.OPTIMISM,
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.SOLANA],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.SOLANA,
          },
          depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
          recipient: solanaRecipient, // Solana wallet address
          slippageTolerance: 0.01,
          type: "exactInput",
          refundOnOrigin: false,
          embeddedActions: [],
          strictTradeType: true,
          isDestinationSvm: true, // Destination is Solana
        },
        bridgeQuote: {} as any,
        contracts: {} as any,
      };

      const result = await _buildCctpTxForAllowanceHolderEvm({
        crossSwapQuotes: quotes,
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.SOLANA,
        intermediaryChainId: CHAIN_IDs.SOLANA,
        tokenMessenger: "0x1234567890123456789012345678901234567890",
        depositForBurnParams: {
          amount: BigNumber.from("1000000"),
          destinationDomain: 5,
          mintRecipient: solanaRecipient,
          destinationCaller: "0x0000000000000000000000000000000000000000",
          maxFee: BigNumber.from(0),
          minFinalityThreshold: 12,
        },
      });

      // Verify that getAssociatedTokenAddress was called with SVM address types
      const recipientSvmAddress = sdk.utils
        .toAddressType(solanaRecipient, CHAIN_IDs.SOLANA)
        .forceSvmAddress();
      const usdcSvmAddress = sdk.utils
        .toAddressType(
          TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.SOLANA],
          CHAIN_IDs.SOLANA
        )
        .forceSvmAddress();

      expect(sdk.arch.svm.getAssociatedTokenAddress).toHaveBeenCalledWith(
        recipientSvmAddress,
        usdcSvmAddress
      );

      // Verify the encoded data contains the token account address (not wallet address)
      expect(result.data).toBe(`0xencoded-mintRecipient:${solanaTokenAccount}`);
    });

    it("should use recipient wallet address when destination is EVM", async () => {
      const quotes: CrossSwapQuotes = {
        crossSwap: {
          amount: BigNumber.from("1000000"),
          inputToken: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.OPTIMISM],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.OPTIMISM,
          },
          outputToken: {
            address: TOKEN_SYMBOLS_MAP.USDC.addresses[CHAIN_IDs.BASE],
            decimals: 6,
            symbol: "USDC",
            chainId: CHAIN_IDs.BASE,
          },
          depositor: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
          recipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
          slippageTolerance: 0.01,
          type: "exactInput",
          refundOnOrigin: false,
          embeddedActions: [],
          strictTradeType: true,
          isDestinationSvm: false, // Destination is EVM
        },
        bridgeQuote: {} as any,
        contracts: {} as any,
      };

      const result = await _buildCctpTxForAllowanceHolderEvm({
        crossSwapQuotes: quotes,
        originChainId: CHAIN_IDs.OPTIMISM,
        destinationChainId: CHAIN_IDs.BASE,
        intermediaryChainId: CHAIN_IDs.BASE,
        tokenMessenger: "0x1234567890123456789012345678901234567890",
        depositForBurnParams: {
          amount: BigNumber.from("1000000"),
          destinationDomain: 6,
          mintRecipient: "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D",
          destinationCaller: "0x0000000000000000000000000000000000000000",
          maxFee: BigNumber.from(0),
          minFinalityThreshold: 12,
        },
      });

      // Verify getAssociatedTokenAddress was NOT called for EVM destinations
      expect(sdk.arch.svm.getAssociatedTokenAddress).not.toHaveBeenCalled();

      // Verify the encoded data contains the wallet address unchanged
      expect(result.data).toBe(
        "0xencoded-mintRecipient:0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D"
      );
    });
  });
});
