import { BigNumber } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { _buildCctpTxForAllowanceHolderEvm } from "../../../../api/_bridges/cctp/strategy";
import { CrossSwapQuotes } from "../../../../api/_dexes/types";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../../../api/_constants";
import { encodeDepositForBurn } from "../../../../api/_bridges/cctp/utils/constants";

// Mock only the SVM utilities we need
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

// Mock CCTP utilities
jest.mock("../../../../api/_bridges/cctp/utils/constants", () => ({
  encodeDepositForBurn: jest.fn(
    (params) => `0xencoded-mintRecipient:${params.mintRecipient}`
  ),
}));

jest.mock("../../../../api/_integrator-id", () => ({
  tagSwapApiMarker: jest.fn((data) => data),
}));

describe("CCTP Strategy - EVM to Solana mint recipient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        isDestinationSvm: false, // Key: destination is EVM
      },
      bridgeQuote: {} as any,
      contracts: {} as any,
    };

    const result = await _buildCctpTxForAllowanceHolderEvm({
      crossSwapQuotes: quotes,
      originChainId: CHAIN_IDs.OPTIMISM,
      destinationChainId: CHAIN_IDs.BASE,
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

  it("passes through SVM destination caller to encodeDepositForBurn", async () => {
    const solanaDestinationCaller =
      "5v4SXbcAKKo3YbPBXU9K7zNBMgJ2RQFsvQmg2RAFZT6t";
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
        recipient: "FmMK62wrtWVb5SVoTZftSCGw3nEDA79hDbZNTRnC1R6t",
        slippageTolerance: 0.01,
        type: "exactInput",
        refundOnOrigin: false,
        embeddedActions: [],
        strictTradeType: true,
        isDestinationSvm: true,
      },
      bridgeQuote: {} as any,
      contracts: {} as any,
    };

    await _buildCctpTxForAllowanceHolderEvm({
      crossSwapQuotes: quotes,
      originChainId: CHAIN_IDs.OPTIMISM,
      destinationChainId: CHAIN_IDs.SOLANA,
      tokenMessenger: "0x1234567890123456789012345678901234567890",
      depositForBurnParams: {
        amount: BigNumber.from("1000000"),
        destinationDomain: 5,
        mintRecipient: quotes.crossSwap.recipient,
        destinationCaller: solanaDestinationCaller,
        maxFee: BigNumber.from(0),
        minFinalityThreshold: 12,
      },
    });

    expect(encodeDepositForBurn).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationCaller: solanaDestinationCaller,
      })
    );
  });

  it("passes through EVM destination caller to encodeDepositForBurn", async () => {
    const evmDestinationCaller = "0x72adB07A487f38321b6665c02D289C413610B081";
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
        isDestinationSvm: false,
      },
      bridgeQuote: {} as any,
      contracts: {} as any,
    };

    await _buildCctpTxForAllowanceHolderEvm({
      crossSwapQuotes: quotes,
      originChainId: CHAIN_IDs.OPTIMISM,
      destinationChainId: CHAIN_IDs.BASE,
      tokenMessenger: "0x1234567890123456789012345678901234567890",
      depositForBurnParams: {
        amount: BigNumber.from("1000000"),
        destinationDomain: 6,
        mintRecipient: quotes.crossSwap.recipient,
        destinationCaller: evmDestinationCaller,
        maxFee: BigNumber.from(0),
        minFinalityThreshold: 12,
      },
    });

    expect(encodeDepositForBurn).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationCaller: evmDestinationCaller,
      })
    );
  });
});
