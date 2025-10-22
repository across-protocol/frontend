import { BigNumber, ethers, utils } from "ethers";
import * as sdk from "@across-protocol/sdk";
import { TokenMessengerMinterV2Client } from "@across-protocol/contracts";
import {
  address,
  generateKeyPairSigner,
  getBase64EncodedWireTransaction,
  appendTransactionMessageInstruction,
  createNoopSigner,
  partiallySignTransaction,
  compileTransaction,
} from "@solana/kit";
import { getAddMemoInstruction } from "@solana-program/memo";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes } from "../../_dexes/types";
import { AppFee, CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { Token } from "../../_dexes/types";
import { InvalidParamError } from "../../_errors";
import { ConvertDecimals } from "../../_utils";
import {
  assertValidIntegratorId,
  SWAP_CALLDATA_MARKER,
  tagIntegratorId,
  tagSwapApiMarker,
} from "../../_integrator-id";
import { getSVMRpc } from "../../_providers";
import {
  CCTP_SUPPORTED_CHAINS,
  CCTP_SUPPORTED_TOKENS,
  CCTP_FINALITY_THRESHOLDS,
  CCTP_FILL_TIME_ESTIMATES,
  getCctpTokenMessengerAddress,
  getCctpMessageTransmitterAddress,
  getCctpDomainId,
  encodeDepositForBurn,
} from "./utils/constants";

const name = "cctp";

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: false,
    B2B: true, // Only USDC-USDC routes are supported
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * CCTP (Cross-Chain Transfer Protocol) bridge strategy for native USDC transfers.
 * Supports Circle's CCTP for burning USDC on source chain.
 */
export function getCctpBridgeStrategy(): BridgeStrategy {
  const getEstimatedFillTime = (originChainId: number): number => {
    // CCTP fill time is determined by the origin chain attestation process
    return CCTP_FILL_TIME_ESTIMATES[originChainId] || 19 * 60; // Default to 19 minutes
  };

  const isRouteSupported = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    // Check if input and output tokens are CCTP-supported
    const isInputTokenSupported = CCTP_SUPPORTED_TOKENS.some(
      (supportedToken) =>
        supportedToken.addresses[params.inputToken.chainId]?.toLowerCase() ===
        params.inputToken.address.toLowerCase()
    );
    const isOutputTokenSupported = CCTP_SUPPORTED_TOKENS.some(
      (supportedToken) =>
        supportedToken.addresses[params.outputToken.chainId]?.toLowerCase() ===
        params.outputToken.address.toLowerCase()
    );
    if (!isInputTokenSupported || !isOutputTokenSupported) {
      return false;
    }

    // Check if both chains are CCTP-supported
    const isOriginChainSupported = CCTP_SUPPORTED_CHAINS.includes(
      params.inputToken.chainId
    );
    const isDestinationChainSupported = CCTP_SUPPORTED_CHAINS.includes(
      params.outputToken.chainId
    );
    if (!isOriginChainSupported || !isDestinationChainSupported) {
      return false;
    }

    return true;
  };

  const assertSupportedRoute = (params: {
    inputToken: Token;
    outputToken: Token;
  }) => {
    if (!isRouteSupported(params)) {
      throw new InvalidParamError({
        message: `CCTP: Route ${params.inputToken.symbol} -> ${params.outputToken.symbol} is not supported`,
      });
    }
  };

  return {
    name,
    capabilities,

    originTxNeedsAllowance: true, // CCTP requires allowance for token burning

    getCrossSwapTypes: (params: {
      inputToken: Token;
      outputToken: Token;
      isInputNative: boolean;
      isOutputNative: boolean;
    }) => {
      if (
        isRouteSupported({
          inputToken: params.inputToken,
          outputToken: params.outputToken,
        })
      ) {
        return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
      }
      return [];
    },

    getBridgeQuoteRecipient: (crossSwap: CrossSwap) => {
      return crossSwap.recipient;
    },

    getBridgeQuoteMessage: (_crossSwap: CrossSwap, _appFee?: AppFee) => {
      return "0x";
    },

    getQuoteForExactInput: async ({
      inputToken,
      outputToken,
      exactInputAmount,
      recipient: _recipient,
      message: _message,
    }: GetExactInputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      const outputAmount = ConvertDecimals(
        inputToken.decimals,
        outputToken.decimals
      )(exactInputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount: exactInputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: getEstimatedFillTime(inputToken.chainId),
          provider: name,
          fees: getCctpBridgeFees(inputToken),
        },
      };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
      forceExactOutput: _forceExactOutput,
      recipient: _recipient,
      message: _message,
    }: GetOutputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      const inputAmount = ConvertDecimals(
        outputToken.decimals,
        inputToken.decimals
      )(minOutputAmount);

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount,
          outputAmount: minOutputAmount,
          minOutputAmount,
          estimatedFillTimeSec: getEstimatedFillTime(inputToken.chainId),
          provider: name,
          fees: getCctpBridgeFees(inputToken),
        },
      };
    },

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string;
    }) => {
      const {
        crossSwap,
        originSwapQuote,
        destinationSwapQuote,
        appFee,
        bridgeQuote,
      } = params.quotes;

      // CCTP validations
      if (appFee?.feeAmount.gt(0)) {
        throw new InvalidParamError({
          message: "App fee is not supported for CCTP bridge transfers",
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message:
            "Origin/destination swaps are not supported for CCTP bridge transfers",
        });
      }

      const originChainId = crossSwap.inputToken.chainId;
      const destinationChainId = crossSwap.outputToken.chainId;
      const destinationDomain = getCctpDomainId(destinationChainId);
      const tokenMessenger = getCctpTokenMessengerAddress(originChainId);

      // depositForBurn input parameters
      const depositForBurnParams = {
        amount: bridgeQuote.inputAmount,
        destinationDomain,
        mintRecipient: crossSwap.recipient,
        destinationCaller: ethers.constants.AddressZero, // Anyone can finalize the message on domain when this is set to bytes32(0)
        maxFee: BigNumber.from(0), // maxFee set to 0 so this will be a "standard" speed transfer
        minFinalityThreshold: CCTP_FINALITY_THRESHOLDS.standard, // Hardcoded minFinalityThreshold value for standard transfer
      };

      if (crossSwap.isOriginSvm) {
        return _buildCctpTxForAllowanceHolderSvm({
          crossSwapQuotes: params.quotes,
          integratorId: params.integratorId,
          originChainId,
          destinationChainId,
          tokenMessenger,
          depositForBurnParams,
        });
      } else {
        return _buildCctpTxForAllowanceHolderEvm({
          crossSwapQuotes: params.quotes,
          integratorId: params.integratorId,
          originChainId,
          destinationChainId,
          tokenMessenger,
          depositForBurnParams,
        });
      }
    },

    isRouteSupported,
  };
}

function getCctpBridgeFees(inputToken: Token) {
  const zeroBN = BigNumber.from(0);
  return {
    totalRelay: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    relayerCapital: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    relayerGas: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    lp: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
    bridgeFee: {
      pct: zeroBN,
      total: zeroBN,
      token: inputToken,
    },
  };
}

/**
 * Builds CCTP deposit transaction for EVM chains
 */
export async function _buildCctpTxForAllowanceHolderEvm(params: {
  crossSwapQuotes: CrossSwapQuotes;
  integratorId?: string;
  originChainId: number;
  destinationChainId: number;
  tokenMessenger: string;
  depositForBurnParams: {
    amount: BigNumber;
    destinationDomain: number;
    mintRecipient: string;
    destinationCaller: string;
    maxFee: BigNumber;
    minFinalityThreshold: number;
  };
}) {
  const {
    crossSwapQuotes,
    integratorId,
    originChainId,
    tokenMessenger,
    depositForBurnParams,
  } = params;
  const { crossSwap } = crossSwapQuotes;
  const burnTokenAddress = crossSwap.inputToken.address;
  const destinationChainId = crossSwap.outputToken.chainId;

  // For transfers going to Solana, mintRecipient must be the recipient's token account, not their wallet
  let mintRecipient = depositForBurnParams.mintRecipient;

  if (crossSwap.isDestinationSvm) {
    // Derive the recipient's token account address for the destination token
    const recipientWallet = sdk.utils.toAddressType(
      depositForBurnParams.mintRecipient,
      destinationChainId
    );
    const destinationTokenMint = sdk.utils.toAddressType(
      crossSwap.outputToken.address,
      destinationChainId
    );
    const recipientTokenAccount = await sdk.arch.svm.getAssociatedTokenAddress(
      recipientWallet.forceSvmAddress(),
      destinationTokenMint.forceSvmAddress()
    );
    mintRecipient = recipientTokenAccount;
  }

  // Encode the depositForBurn call
  const callData = encodeDepositForBurn({
    ...depositForBurnParams,
    mintRecipient,
    burnToken: burnTokenAddress,
  });

  // Handle integrator ID and swap API marker tagging
  const callDataWithIntegratorId = integratorId
    ? tagIntegratorId(integratorId, callData)
    : callData;
  const callDataWithMarkers = tagSwapApiMarker(callDataWithIntegratorId);

  return {
    chainId: originChainId,
    from: crossSwap.depositor,
    to: tokenMessenger,
    data: callDataWithMarkers,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
  };
}

/**
 * Builds CCTP deposit transaction for Solana
 */
async function _buildCctpTxForAllowanceHolderSvm(params: {
  crossSwapQuotes: CrossSwapQuotes;
  integratorId?: string;
  originChainId: number;
  destinationChainId: number;
  tokenMessenger: string;
  depositForBurnParams: {
    amount: BigNumber;
    destinationDomain: number;
    mintRecipient: string;
    destinationCaller: string;
    maxFee: BigNumber;
    minFinalityThreshold: number;
  };
}) {
  if (params.integratorId) {
    assertValidIntegratorId(params.integratorId);
  }

  const {
    crossSwapQuotes,
    integratorId,
    originChainId,
    destinationChainId,
    tokenMessenger,
    depositForBurnParams,
  } = params;
  const { crossSwap } = crossSwapQuotes;

  // Get message transmitter address
  const messageTransmitter = getCctpMessageTransmitterAddress(originChainId);

  // Convert addresses to Solana Kit address format for instruction parameters.
  const depositor = sdk.utils.toAddressType(crossSwap.depositor, originChainId);
  const mintRecipient = sdk.utils.toAddressType(
    depositForBurnParams.mintRecipient,
    destinationChainId
  );
  const destinationCaller = sdk.utils.toAddressType(
    depositForBurnParams.destinationCaller,
    destinationChainId
  );
  const tokenMint = sdk.utils.toAddressType(
    crossSwap.inputToken.address,
    originChainId
  );

  // Address class handles intermediate conversions internally (e.g., EVM address -> bytes32 -> base58).
  const mintRecipientAddress = address(mintRecipient.toBase58());
  const destinationCallerAddress = address(destinationCaller.toBase58());
  const tokenMessengerAddress = address(tokenMessenger);
  const messageTransmitterAddress = address(messageTransmitter);
  const tokenMintAddress = address(tokenMint.toBase58());
  const depositorAddress = address(depositor.toBase58());

  // Get depositor's USDC token account
  const depositorTokenAccount = await sdk.arch.svm.getAssociatedTokenAddress(
    depositor.forceSvmAddress(),
    tokenMint.forceSvmAddress()
  );

  // Generate a keypair for the MessageSent event account (CCTP V2 requirement).
  // Unlike EVM chains that use event logs, Solana CCTP stores events in on-chain accounts for persistence.
  // This account costs ~0.0038 SOL in rent (paid by depositor), reclaimable after 5 days via reclaim_event_account.
  // We partially sign the transaction with this keypair and the depositor adds their signature before submission.
  // Docs: https://developers.circle.com/cctp/solana-programs#tokenmessengerminterv2
  const eventDataKeypair = await generateKeyPairSigner();

  // Get CCTP deposit accounts
  const cctpAccounts = await sdk.arch.svm.getCCTPDepositAccounts(
    originChainId,
    depositForBurnParams.destinationDomain,
    tokenMessengerAddress,
    messageTransmitterAddress
  );

  // Create signers
  const depositorSigner = createNoopSigner(depositorAddress);

  // Use the TokenMessenger client to build the instruction
  const depositInstruction =
    await TokenMessengerMinterV2Client.getDepositForBurnInstructionAsync({
      owner: depositorSigner,
      eventRentPayer: depositorSigner,
      senderAuthorityPda: cctpAccounts.tokenMessengerMinterSenderAuthority,
      burnTokenAccount: depositorTokenAccount,
      messageTransmitter: cctpAccounts.messageTransmitter,
      tokenMessenger: cctpAccounts.tokenMessenger,
      remoteTokenMessenger: cctpAccounts.remoteTokenMessenger,
      tokenMinter: cctpAccounts.tokenMinter,
      localToken: cctpAccounts.localToken,
      burnTokenMint: tokenMintAddress,
      messageSentEventData: eventDataKeypair,
      eventAuthority: cctpAccounts.cctpEventAuthority,
      program: tokenMessengerAddress,
      amount: BigInt(depositForBurnParams.amount.toString()),
      destinationDomain: depositForBurnParams.destinationDomain,
      mintRecipient: mintRecipientAddress,
      destinationCaller: destinationCallerAddress,
      maxFee: BigInt(depositForBurnParams.maxFee.toString()),
      minFinalityThreshold: depositForBurnParams.minFinalityThreshold,
    });

  // Build the transaction message using SDK helper
  const rpcClient = getSVMRpc(originChainId);
  let tx = await sdk.arch.svm.createDefaultTransaction(
    rpcClient,
    depositorSigner
  );

  // Add the deposit instruction
  tx = appendTransactionMessageInstruction(depositInstruction, tx);

  // Add integrator memo if provided and Swap API marker
  tx = appendTransactionMessageInstruction(
    getAddMemoInstruction({
      memo: integratorId
        ? utils.hexConcat([integratorId, SWAP_CALLDATA_MARKER])
        : SWAP_CALLDATA_MARKER,
    }),
    tx
  );

  // Compile the transaction message
  const compiledTx = compileTransaction(tx);

  // Partially sign the transaction with only the event data keypair
  // The depositor will also sign before submitting
  const partiallySignedTx = await partiallySignTransaction(
    [eventDataKeypair.keyPair],
    compiledTx
  );

  // Encode the partially signed transaction
  const base64EncodedTx = getBase64EncodedWireTransaction(partiallySignedTx);

  return {
    chainId: originChainId,
    to: tokenMessengerAddress,
    data: base64EncodedTx,
    ecosystem: "svm" as const,
  };
}
