import { BigNumber, ethers, utils } from "ethers";
import {
  address,
  appendTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  partiallySignTransaction,
} from "@solana/kit";
import { getAddMemoInstruction } from "@solana-program/memo";
import * as sdk from "@across-protocol/sdk";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import { AppFee, CROSS_SWAP_TYPE } from "../../_dexes/utils";
import { CCTP_FINALITY_THRESHOLDS } from "../cctp/utils/constants";
import { InvalidParamError } from "../../_errors";
import { ConvertDecimals } from "../../_utils";
import { getFallbackRecipient } from "../../_dexes/utils";
import { getEstimatedFillTime } from "../cctp/utils/fill-times";
import { getZeroBridgeFees } from "../utils";
import { getCctpFees } from "../cctp/utils/hypercore";
import { buildSponsoredCCTPQuote } from "./utils/quote-builder";
import {
  SPONSORED_CCTP_DESTINATION_CHAINS,
  SPONSORED_CCTP_INPUT_TOKENS,
  SPONSORED_CCTP_ORIGIN_CHAINS,
  SPONSORED_CCTP_OUTPUT_TOKENS,
  SPONSORED_CCTP_SRC_PERIPHERY_ADDRESSES,
  CCTP_TRANSFER_MODE,
} from "./utils/constants";
import { simulateMarketOrder, SPOT_TOKEN_DECIMALS } from "../../_hypercore";
import { SPONSORED_CCTP_SRC_PERIPHERY_ABI } from "./utils/abi";
import {
  SWAP_CALLDATA_MARKER,
  tagIntegratorId,
  tagSwapApiMarker,
} from "../../_integrator-id";
import { getSlippage } from "../../_slippage";
import { getCctpBridgeStrategy } from "../cctp/strategy";
import { getDepositAccounts } from "./utils/svm";
import { getDepositForBurnInstructionAsync } from "../../_svm-clients/SponsoredCctpSrcPeriphery/depositForBurn";
import { getSVMRpc } from "../../_providers";

const name = "sponsored-cctp" as const;

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: false,
    B2B: true,
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * Sponsored CCTP bridge strategy
 */
export function getSponsoredCctpBridgeStrategy(
  isEligibleForSponsorship: boolean
): BridgeStrategy {
  return {
    name,
    capabilities,
    originTxNeedsAllowance: true,
    isRouteSupported,

    getCrossSwapTypes: ({ inputToken, outputToken }) => {
      if (isRouteSupported({ inputToken, outputToken })) {
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
    getQuoteForExactInput: (params: GetExactInputBridgeQuoteParams) =>
      isEligibleForSponsorship
        ? getQuoteForExactInput(params)
        : getCctpBridgeStrategy().getQuoteForExactInput(params),
    getQuoteForOutput: (params: GetOutputBridgeQuoteParams) =>
      isEligibleForSponsorship
        ? getQuoteForOutput(params)
        : getCctpBridgeStrategy().getQuoteForOutput(params),
    buildTxForAllowanceHolder: (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string;
    }) =>
      params.quotes.crossSwap.isOriginSvm
        ? buildSvmTxForAllowanceHolder({
            ...params,
            isEligibleForSponsorship,
          })
        : buildEvmTxForAllowanceHolder({
            ...params,
            isEligibleForSponsorship,
          }),
  };
}

export function isRouteSupported(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  return (
    SPONSORED_CCTP_ORIGIN_CHAINS.includes(params.inputToken.chainId) &&
    SPONSORED_CCTP_DESTINATION_CHAINS.includes(params.outputToken.chainId) &&
    SPONSORED_CCTP_INPUT_TOKENS.some(
      (tokenSymbol) =>
        tokenSymbol.toLowerCase() === params.inputToken.symbol.toLowerCase()
    ) &&
    SPONSORED_CCTP_OUTPUT_TOKENS.some(
      (tokenSymbol) =>
        tokenSymbol.toLowerCase() === params.outputToken.symbol.toLowerCase()
    )
  );
}

export async function getQuoteForExactInput({
  inputToken,
  outputToken,
  exactInputAmount,
}: GetExactInputBridgeQuoteParams) {
  assertSupportedRoute({ inputToken, outputToken });

  // We guarantee input amount == output amount for sponsored flows
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
      estimatedFillTimeSec: getEstimatedFillTime(
        inputToken.chainId,
        CCTP_TRANSFER_MODE
      ),
      provider: name,
      fees: getZeroBridgeFees(inputToken),
    },
  };
}

export async function getQuoteForOutput({
  inputToken,
  outputToken,
  minOutputAmount,
}: GetOutputBridgeQuoteParams) {
  assertSupportedRoute({ inputToken, outputToken });

  // We guarantee input amount == output amount for sponsored flows
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
      estimatedFillTimeSec: getEstimatedFillTime(
        inputToken.chainId,
        CCTP_TRANSFER_MODE
      ),
      provider: name,
      fees: getZeroBridgeFees(inputToken),
    },
  };
}

export async function buildEvmTxForAllowanceHolder(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const { crossSwap } = params.quotes;

  const { quote, signature, sponsoredCctpSrcPeripheryAddress } =
    await _prepareSponsoredTx(params);

  const iface = new ethers.utils.Interface(SPONSORED_CCTP_SRC_PERIPHERY_ABI);
  const callData = iface.encodeFunctionData("depositForBurn", [
    quote,
    signature,
  ]);

  const callDataWithIntegratorId = params.integratorId
    ? tagIntegratorId(params.integratorId, callData)
    : callData;
  const callDataWithMarkers = tagSwapApiMarker(callDataWithIntegratorId);

  return {
    chainId: crossSwap.inputToken.chainId,
    from: crossSwap.depositor,
    to: sponsoredCctpSrcPeripheryAddress,
    data: callDataWithMarkers,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
  };
}

export async function buildSvmTxForAllowanceHolder(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const { crossSwap } = params.quotes;
  const originChainId = crossSwap.inputToken.chainId;
  const rpcClient = getSVMRpc(originChainId);

  const { quote, signature, sponsoredCctpSrcPeripheryAddress } =
    await _prepareSponsoredTx(params);

  // Retrieve accounts required for `depositForBurn` instruction
  // and encode the instruction.
  const depositAccounts = await getDepositAccounts({
    originChainId,
    depositor: crossSwap.depositor,
    destinationDomain: quote.destinationDomain,
    sponsoredCctpSrcPeripheryAddress,
    nonce: quote.nonce,
    inputToken: crossSwap.inputToken.address,
  });
  const svmEncodedQuote = {
    sourceDomain: quote.sourceDomain,
    destinationDomain: quote.destinationDomain,
    mintRecipient: address(
      sdk.utils.toAddressType(quote.mintRecipient, originChainId).toBase58()
    ),
    amount: BigInt(quote.amount.toString()),
    burnToken: address(
      sdk.utils.toAddressType(quote.burnToken, originChainId).toBase58()
    ),
    destinationCaller: address(
      sdk.utils.toAddressType(quote.destinationCaller, originChainId).toBase58()
    ),
    maxFee: BigInt(quote.maxFee.toString()),
    minFinalityThreshold: quote.minFinalityThreshold,
    nonce: ethers.utils.arrayify(quote.nonce),
    deadline: BigInt(quote.deadline.toString()),
    maxBpsToSponsor: BigInt(quote.maxBpsToSponsor.toString()),
    maxUserSlippageBps: BigInt(quote.maxUserSlippageBps.toString()),
    finalRecipient: address(
      sdk.utils.toAddressType(quote.finalRecipient, originChainId).toBase58()
    ),
    finalToken: address(
      sdk.utils.toAddressType(quote.finalToken, originChainId).toBase58()
    ),
    executionMode: quote.executionMode,
    actionData: ethers.utils.arrayify(quote.actionData),
  };
  const depositForBurnIx = await getDepositForBurnInstructionAsync({
    ...depositAccounts,
    quote: svmEncodedQuote,
    signature: ethers.utils.arrayify(signature),
  });

  // Add deposit ix and integrator memo to the transaction
  let tx = await sdk.arch.svm.createDefaultTransaction(
    rpcClient,
    depositAccounts.signer
  );
  tx = appendTransactionMessageInstruction(depositForBurnIx, tx);
  tx = appendTransactionMessageInstruction(
    getAddMemoInstruction({
      memo: params.integratorId
        ? utils.hexConcat([params.integratorId, SWAP_CALLDATA_MARKER])
        : SWAP_CALLDATA_MARKER,
    }),
    tx
  );

  const compiledTx = compileTransaction(tx);
  const partiallySignedTx = await partiallySignTransaction(
    [depositAccounts.messageSentEventData.keyPair],
    compiledTx
  );
  const base64EncodedTx = getBase64EncodedWireTransaction(partiallySignedTx);

  return {
    chainId: originChainId,
    to: sponsoredCctpSrcPeripheryAddress,
    data: base64EncodedTx,
    ecosystem: "svm" as const,
  };
}

async function _prepareSponsoredTx(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const {
    bridgeQuote,
    crossSwap,
    originSwapQuote,
    destinationSwapQuote,
    appFee,
  } = params.quotes;

  assertSupportedRoute({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
  });

  const originChainId = crossSwap.inputToken.chainId;
  const sponsoredCctpSrcPeripheryAddress =
    SPONSORED_CCTP_SRC_PERIPHERY_ADDRESSES[originChainId];

  if (!sponsoredCctpSrcPeripheryAddress) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: 'SponsoredCCTPSrcPeriphery' address not found for chain ${originChainId}`,
    });
  }

  if (appFee?.feeAmount.gt(0)) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: App fee is not supported`,
    });
  }

  if (originSwapQuote || destinationSwapQuote) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: Origin/destination swaps are not supported`,
    });
  }

  const minFinalityThreshold = CCTP_FINALITY_THRESHOLDS[CCTP_TRANSFER_MODE];

  // Calculate `maxFee` as required by `depositForBurnWithHook`
  let maxFee = BigNumber.from(0);

  // If eligible for sponsorship, we need to calculate the max fee based on the CCTP fees.
  if (params.isEligibleForSponsorship) {
    const { transferFeeBps, forwardFee } = await getCctpFees({
      inputToken: crossSwap.inputToken,
      outputToken: crossSwap.outputToken,
      minFinalityThreshold,
    });
    const transferFee = bridgeQuote.inputAmount.mul(transferFeeBps).div(10_000);
    maxFee = transferFee.add(forwardFee);
  }
  // If not eligible for sponsorship, we use the pre-calculated max fee from the bridge quote.
  else {
    maxFee = bridgeQuote.fees.amount;
  }

  // Calculate `maxBpsToSponsor` based on `maxFee` and est. swap slippage
  const maxBpsToSponsor = params.isEligibleForSponsorship
    ? // If eligible for sponsorship, we need to calculate the max fee based on the CCTP fees.
      await calculateMaxBpsToSponsor({
        inputToken: crossSwap.inputToken,
        outputToken: crossSwap.outputToken,
        maxFee,
        inputAmount: bridgeQuote.inputAmount,
      })
    : // If not eligible for sponsorship, we use 0 bps as maxBpsToSponsor. This will
      // trigger the un-sponsored flow in the destination periphery contract.
      0;
  const maxBpsToSponsorBn = BigNumber.from(Math.ceil(maxBpsToSponsor));

  // Convert slippage tolerance (expressed as 0 < slippage < 100, e.g. 1 = 1%) set by user to bps
  const maxUserSlippageBps = Math.floor(
    getSlippage({
      tokenIn: {
        ...crossSwap.inputToken,
        chainId: crossSwap.outputToken.chainId,
      },
      tokenOut: crossSwap.outputToken,
      slippageTolerance: crossSwap.slippageTolerance,
      originOrDestination: "destination",
    }) * 100
  );

  const { quote, signature } = buildSponsoredCCTPQuote({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    inputAmount: bridgeQuote.inputAmount,
    recipient: crossSwap.recipient,
    depositor: crossSwap.depositor,
    refundRecipient: getFallbackRecipient(crossSwap, crossSwap.recipient),
    maxBpsToSponsor: maxBpsToSponsorBn,
    maxUserSlippageBps,
    maxFee,
  });

  return {
    quote,
    signature,
    sponsoredCctpSrcPeripheryAddress,
  };
}

export async function calculateMaxBpsToSponsor(params: {
  inputToken: Token;
  outputToken: Token;
  maxFee: BigNumber;
  inputAmount: BigNumber;
}) {
  const { inputToken, outputToken, maxFee, inputAmount } = params;

  assertSupportedRoute({ inputToken, outputToken });

  const maxFeeBps = maxFee
    .mul(10_000)
    .mul(utils.parseEther("1"))
    .div(inputAmount);

  let maxBpsToSponsor = maxFeeBps;

  // Simple transfer flow: no swap needed, therefore `maxBpsToSponsor` is `maxFee` in bps
  if (outputToken.symbol === "USDC") {
    maxBpsToSponsor = maxFeeBps;
  }
  // Swap flow: `maxBpsToSponsor` is `maxFee` + est. swap slippage if slippage is positive
  // or only `maxFee` if slippage is negative.
  else {
    const bridgeOutputAmountInputTokenDecimals = params.inputAmount.sub(
      params.maxFee
    );
    const bridgeOutputAmountOutputTokenDecimals = ConvertDecimals(
      params.inputToken.decimals,
      params.outputToken.decimals
    )(bridgeOutputAmountInputTokenDecimals);

    // Retrieve est. swap slippage by simulating a market order for token pair
    const simResult = await simulateMarketOrder({
      chainId: outputToken.chainId,
      tokenIn: {
        symbol: "USDC",
        decimals: SPOT_TOKEN_DECIMALS,
      },
      tokenOut: {
        symbol: outputToken.symbol,
        decimals: outputToken.decimals,
      },
      inputAmount: bridgeOutputAmountOutputTokenDecimals,
    });
    const slippageBps = BigNumber.from(
      Math.ceil(simResult.slippagePercent * 100)
    ).mul(utils.parseEther("1"));

    // Positive slippage indicates loss, so we add it to `maxFeeBps`
    if (simResult.slippagePercent > 0) {
      maxBpsToSponsor = maxFeeBps.add(slippageBps);
    }
    // Negative slippage indicates profit, so we return `maxFeeBps`
    else {
      maxBpsToSponsor = maxFeeBps;
    }
  }

  return parseFloat(utils.formatEther(maxBpsToSponsor));
}

function assertSupportedRoute(params: {
  inputToken: Token;
  outputToken: Token;
}) {
  if (!isRouteSupported(params)) {
    throw new InvalidParamError({
      message: `Sponsored CCTP: Route ${
        params.inputToken.symbol
      } (${params.inputToken.chainId}) -> ${
        params.outputToken.symbol
      } (${params.outputToken.chainId}) is not supported`,
    });
  }
}
