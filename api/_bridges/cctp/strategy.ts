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
  getCctpTokenMessengerAddress,
  getCctpMessageTransmitterAddress,
  getCctpDomainId,
  getCctpForwarderAddress,
  encodeDepositForBurn,
  encodeDepositForBurnWithHook,
} from "./utils/constants";
import { CHAIN_IDs } from "../../_constants";
import {
  buildCctpTxHyperEvmToHyperCore,
  getAmountToHyperCore,
  isHyperEvmToHyperCoreRoute,
  isEvmToHyperCoreRoute,
  isToHyperCore,
  encodeForwardHookData,
  getCctpFees,
} from "./utils/hypercore";
import { getEstimatedFillTime } from "./utils/fill-times";

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

  /**
   * Determines the appropriate CCTP finality threshold for a route.
   * When going to HyperCore we use fast finality, all others use standard.
   */
  const getFinalityThreshold = (destinationChainId: number): number => {
    return isToHyperCore(destinationChainId)
      ? CCTP_FINALITY_THRESHOLDS.fast
      : CCTP_FINALITY_THRESHOLDS.standard;
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
      recipient,
      message: _message,
    }: GetExactInputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      let maxFee = BigNumber.from(0);
      let outputAmount: BigNumber;
      let standardOrFast: "standard" | "fast" = "standard";
      if (isToHyperCore(outputToken.chainId)) {
        // Query CCTP fee configuration for HyperCore destinations
        const minFinalityThreshold = getFinalityThreshold(outputToken.chainId);
        const { transferFeeBps, forwardFee } = await getCctpFees({
          inputToken,
          outputToken,
          minFinalityThreshold,
        });

        // Calculate actual fee:
        // transferFee = input * (bps / 10000)
        // maxFee = transferFee + forwardFee
        const transferFee = exactInputAmount.mul(transferFeeBps).div(10000);
        maxFee = transferFee.add(forwardFee);

        // First subtract the CCTP fee from input
        const remainingInputAmount = exactInputAmount.sub(maxFee);

        // Then calculate HyperCore output (accounting for account creation fee if needed)
        outputAmount = await getAmountToHyperCore({
          inputToken,
          outputToken,
          inputOrOutput: "input",
          amount: remainingInputAmount,
          recipient,
        });
        standardOrFast = "fast";
      } else {
        // Standard conversion after fees
        const inputAfterFee = exactInputAmount.sub(maxFee);
        outputAmount = ConvertDecimals(
          inputToken.decimals,
          outputToken.decimals
        )(inputAfterFee);
      }

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount: exactInputAmount,
          outputAmount,
          minOutputAmount: outputAmount,
          estimatedFillTimeSec: getEstimatedFillTime(
            inputToken.chainId,
            standardOrFast
          ),
          provider: name,
          fees: getCctpBridgeFees(inputToken, maxFee),
        },
      };
    },

    getQuoteForOutput: async ({
      inputToken,
      outputToken,
      minOutputAmount,
      forceExactOutput: _forceExactOutput,
      recipient,
      message: _message,
    }: GetOutputBridgeQuoteParams) => {
      assertSupportedRoute({ inputToken, outputToken });

      const destinationIsHyperCore = isToHyperCore(outputToken.chainId);

      // Calculate how much needs to arrive on destination after HyperCore account creation fee (if applicable)
      // For HyperCore: minOutputAmount + accountCreationFee (if needed)
      // For other chains: just minOutputAmount
      const amountToArriveOnDestination = destinationIsHyperCore
        ? await getAmountToHyperCore({
            inputToken,
            outputToken,
            inputOrOutput: "output",
            amount: minOutputAmount,
            recipient,
          })
        : ConvertDecimals(
            outputToken.decimals,
            inputToken.decimals
          )(minOutputAmount);

      // Calculate how much to send from origin to cover CCTP fees
      let inputAmount: BigNumber;
      let maxFee = BigNumber.from(0);
      let standardOrFast: "standard" | "fast" = "standard";

      if (destinationIsHyperCore) {
        standardOrFast = "fast";
        const minFinalityThreshold = getFinalityThreshold(outputToken.chainId);
        const { transferFeeBps, forwardFee } = await getCctpFees({
          inputToken,
          outputToken,
          minFinalityThreshold,
        });

        // Solve for required input based on the following equation:
        // inputAmount - (inputAmount * bps / 10000) - forwardFee = amountToArriveOnDestination
        // Rearranging: inputAmount * (1 - bps/10000) = amountToArriveOnDestination + forwardFee
        // Therefore: inputAmount = (amountToArriveOnDestination + forwardFee) * 10000 / (10000 - bps)
        // Note: 10000 converts basis points to the same scale as amounts (1 bps = 1/10000 of the total)
        const bpsFactor = BigNumber.from(10000).sub(transferFeeBps);
        inputAmount = amountToArriveOnDestination
          .add(forwardFee)
          .mul(10000)
          .div(bpsFactor);

        // Calculate total CCTP fee (transfer fee + forward fee)
        const transferFee = inputAmount.mul(transferFeeBps).div(10000);
        maxFee = transferFee.add(forwardFee);
      } else {
        // Standard non-HyperCore route (no CCTP fees for now)
        inputAmount = amountToArriveOnDestination;
      }

      return {
        bridgeQuote: {
          inputToken,
          outputToken,
          inputAmount,
          outputAmount: minOutputAmount,
          minOutputAmount,
          estimatedFillTimeSec: getEstimatedFillTime(
            inputToken.chainId,
            standardOrFast
          ),
          provider: name,
          fees: getCctpBridgeFees(inputToken, maxFee),
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

      // Handle HyperEVM → HyperCore with special CoreWallet flow
      if (
        isHyperEvmToHyperCoreRoute({
          inputToken: crossSwap.inputToken,
          outputToken: crossSwap.outputToken,
        })
      ) {
        return buildCctpTxHyperEvmToHyperCore(params);
      }

      // When going to HyperCore, we need to route through HyperEVM's CCTP domain
      const isDestinationHyperCore = isToHyperCore(destinationChainId);
      const destinationChainIdForCctp = isDestinationHyperCore
        ? CHAIN_IDs.HYPEREVM
        : destinationChainId;

      // Get CCTP domain IDs and addresses
      const destinationDomain = getCctpDomainId(destinationChainIdForCctp);
      const tokenMessenger = getCctpTokenMessengerAddress(originChainId);

      // Read CCTP fees from the bridge quote (pre-calculated during quote generation)
      const maxFee = bridgeQuote.fees.amount;
      // Get the appropriate finality threshold for the destination
      const minFinalityThreshold = getFinalityThreshold(destinationChainId);

      // depositForBurn input parameters
      const depositForBurnParams = {
        amount: bridgeQuote.inputAmount,
        destinationDomain,
        mintRecipient: crossSwap.recipient,
        destinationCaller: ethers.constants.AddressZero, // Anyone can finalize the message on domain when this is set to bytes32(0)
        maxFee,
        minFinalityThreshold,
      };

      if (crossSwap.isOriginSvm) {
        return _buildCctpTxForAllowanceHolderSvm({
          crossSwapQuotes: params.quotes,
          integratorId: params.integratorId,
          originChainId,
          destinationChainId, // Actual destination
          intermediaryChainId: destinationChainIdForCctp, // Intermediary chain for routes that use a forwarder
          tokenMessenger,
          depositForBurnParams,
        });
      } else {
        return _buildCctpTxForAllowanceHolderEvm({
          crossSwapQuotes: params.quotes,
          integratorId: params.integratorId,
          originChainId,
          destinationChainId, // Actual destination
          intermediaryChainId: destinationChainIdForCctp, // Intermediary chain for routes that use a forwarder
          tokenMessenger,
          depositForBurnParams,
        });
      }
    },

    isRouteSupported,
  };
}

function getCctpBridgeFees(
  inputToken: Token,
  maxFee: BigNumber = BigNumber.from(0)
) {
  const zeroBN = BigNumber.from(0);
  return {
    pct: zeroBN,
    amount: maxFee,
    token: inputToken,
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
  intermediaryChainId: number;
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
    intermediaryChainId,
    tokenMessenger,
    depositForBurnParams,
  } = params;
  const { crossSwap } = crossSwapQuotes;
  const burnTokenAddress = crossSwap.inputToken.address;

  // Check if this is an EVM → HyperCore route (needs depositForBurnWithHook)
  const isEvmToHyperCore = isEvmToHyperCoreRoute({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
  });

  let callData: string;

  if (isEvmToHyperCore) {
    // For EVM → HyperCore: use depositForBurnWithHook with CCTP Forwarder
    // Use intermediaryChainId (HyperEVM) to get the forwarder address
    const forwarderAddress = getCctpForwarderAddress(intermediaryChainId);
    const hookData = encodeForwardHookData(crossSwap.recipient);

    callData = encodeDepositForBurnWithHook({
      amount: depositForBurnParams.amount,
      destinationDomain: depositForBurnParams.destinationDomain,
      mintRecipient: forwarderAddress,
      burnToken: burnTokenAddress,
      destinationCaller: forwarderAddress,
      maxFee: depositForBurnParams.maxFee,
      minFinalityThreshold: depositForBurnParams.minFinalityThreshold,
      hookData,
    });
  } else {
    // For transfers going to Solana, mintRecipient must be the recipient's token account, not their wallet
    let mintRecipient = depositForBurnParams.mintRecipient;

    if (crossSwap.isDestinationSvm) {
      const destinationChainId = crossSwap.outputToken.chainId;
      // Derive the recipient's token account address for the destination token
      const recipientWallet = sdk.utils.toAddressType(
        depositForBurnParams.mintRecipient,
        destinationChainId
      );
      const destinationTokenMint = sdk.utils.toAddressType(
        crossSwap.outputToken.address,
        destinationChainId
      );
      const recipientTokenAccount =
        await sdk.arch.svm.getAssociatedTokenAddress(
          recipientWallet.forceSvmAddress(),
          destinationTokenMint.forceSvmAddress()
        );
      mintRecipient = recipientTokenAccount;
    }

    // Standard CCTP route: use depositForBurn
    callData = encodeDepositForBurn({
      ...depositForBurnParams,
      mintRecipient,
      burnToken: burnTokenAddress,
    });
  }

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
  intermediaryChainId: number;
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
    intermediaryChainId,
    tokenMessenger,
    depositForBurnParams,
  } = params;
  const { crossSwap } = crossSwapQuotes;

  const destinationIsHyperCore = isToHyperCore(destinationChainId);

  // Get message transmitter address
  const messageTransmitter = getCctpMessageTransmitterAddress(originChainId);

  // Convert addresses to Solana Kit address format for instruction parameters.
  const depositor = sdk.utils.toAddressType(crossSwap.depositor, originChainId);
  const tokenMint = sdk.utils.toAddressType(
    crossSwap.inputToken.address,
    originChainId
  );

  // Determine mint recipient and destination caller
  // When going to HyperCore, route through the CCTP Forwarder contract on the intermediary chain (HyperEVM)
  let mintRecipient: sdk.utils.Address;
  let destinationCaller: sdk.utils.Address;

  if (destinationIsHyperCore) {
    const forwarderAddress = getCctpForwarderAddress(intermediaryChainId);
    mintRecipient = sdk.utils.toAddressType(
      forwarderAddress,
      intermediaryChainId
    );
    destinationCaller = sdk.utils.toAddressType(
      forwarderAddress,
      intermediaryChainId
    );
  } else {
    mintRecipient = sdk.utils.toAddressType(
      depositForBurnParams.mintRecipient,
      destinationChainId
    );
    destinationCaller = sdk.utils.toAddressType(
      depositForBurnParams.destinationCaller,
      destinationChainId
    );
  }

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

  // Common parameters for both depositForBurn and depositForBurnWithHook
  const depositInstructionParams = {
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
  };

  // Use the TokenMessenger client to build the instruction
  const depositInstruction = destinationIsHyperCore
    ? await TokenMessengerMinterV2Client.getDepositForBurnWithHookInstructionAsync(
        {
          ...depositInstructionParams,
          hookData: new Uint8Array(
            Buffer.from(
              encodeForwardHookData(crossSwap.recipient).slice(2),
              "hex"
            )
          ),
        }
      )
    : await TokenMessengerMinterV2Client.getDepositForBurnInstructionAsync(
        depositInstructionParams
      );

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
