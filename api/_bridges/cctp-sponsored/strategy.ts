import { BigNumber, ethers, utils } from "ethers";

import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import { AMOUNT_TYPE, AppFee, CROSS_SWAP_TYPE } from "../../_dexes/utils";
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
} from "./utils/constants";
import { simulateMarketOrder, SPOT_TOKEN_DECIMALS } from "../../_hypercore";
import { SPONSORED_CCTP_SRC_PERIPHERY_ABI } from "./utils/abi";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";

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

// TODO: Should this always be fast?
const cctpMode = "fast" as const;

/**
 * Sponsored CCTP bridge strategy
 */
export function getSponsoredCctpBridgeStrategy(): BridgeStrategy {
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
    getQuoteForExactInput,
    getQuoteForOutput,
    // TODO: ADD Solana support
    buildTxForAllowanceHolder: buildEvmTxForAllowanceHolder,
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
      estimatedFillTimeSec: getEstimatedFillTime(inputToken.chainId, cctpMode),
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
      estimatedFillTimeSec: getEstimatedFillTime(inputToken.chainId, cctpMode),
      provider: name,
      fees: getZeroBridgeFees(inputToken),
    },
  };
}

export async function buildEvmTxForAllowanceHolder(params: {
  quotes: CrossSwapQuotes;
  integratorId?: string;
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

  const minFinalityThreshold = CCTP_FINALITY_THRESHOLDS[cctpMode];

  // Calculate `maxFee` as required by `depositForBurnWithHook`
  const { transferFeeBps, forwardFee } = await getCctpFees({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    minFinalityThreshold,
  });
  const transferFee = bridgeQuote.inputAmount.mul(transferFeeBps).div(10_000);
  const maxFee = transferFee.add(forwardFee);

  // Calculate `maxBpsToSponsor` based on `maxFee` and est. swap slippage
  const maxBpsToSponsor = await calculateMaxBpsToSponsor({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    maxFee,
    inputAmount:
      crossSwap.type === AMOUNT_TYPE.EXACT_INPUT
        ? bridgeQuote.inputAmount
        : bridgeQuote.inputAmount.add(maxFee),
  });
  const maxBpsToSponsorBn = BigNumber.from(Math.ceil(maxBpsToSponsor));

  // Convert slippage tolerance (expressed as 0 < slippage < 100, e.g. 1 = 1%) set by user to bps
  const maxUserSlippageBps = Math.floor(crossSwap.slippageTolerance * 100);

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
    chainId: originChainId,
    from: crossSwap.depositor,
    to: sponsoredCctpSrcPeripheryAddress,
    data: callDataWithMarkers,
    value: BigNumber.from(0),
    ecosystem: "evm" as const,
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
