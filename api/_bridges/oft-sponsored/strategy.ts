import { BigNumber, ethers } from "ethers";
import {
  BridgeCapabilities,
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  GetOutputBridgeQuoteParams,
} from "../types";
import { OFT_MESSENGERS } from "../oft/utils/constants";
import {
  getEstimatedFillTime,
  getOftBridgeFees,
  getQuote,
  getSponsoredOftComposerMessageForQuoting,
  roundAmountToSharedDecimals,
} from "../oft/utils/shared";
import { CHAIN_IDs, TOKEN_SYMBOLS_MAP } from "../../_constants";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import {
  AppFee,
  assertMinOutputAmount,
  CROSS_SWAP_TYPE,
  getFallbackRecipient,
} from "../../_dexes/utils";
import { InvalidParamError } from "../../_errors";
import { simulateMarketOrder, SPOT_TOKEN_DECIMALS } from "../../_hypercore";
import { tagIntegratorId, tagSwapApiMarker } from "../../_integrator-id";
import {
  addMarkupToAmount,
  ConvertDecimals,
  getCachedTokenInfo,
} from "../../_utils";
import { getNativeTokenInfo } from "../../_token-info";
import { SPONSORED_OFT_SRC_PERIPHERY_ABI } from "./utils/abi";
import {
  DST_OFT_HANDLER,
  SPONSORED_OFT_DESTINATION_CHAINS,
  SPONSORED_OFT_INPUT_TOKENS,
  SPONSORED_OFT_OUTPUT_TOKENS,
  SPONSORED_OFT_SRC_PERIPHERY,
} from "./utils/constants";
import { buildSponsoredOFTQuote } from "./utils/quote-builder";
import { getSlippage } from "../../_slippage";
import { ExecutionMode, generateQuoteNonce } from "../../_sponsorship-utils";
import { toBytes32 } from "../../_address";

// We add some markup to the native fee for the initial quote to account for gas price
// volatility. Expressed as a percentage, e.g., 0.01 = 1%.
const INITIAL_QUOTE_NATIVE_FEE_MARKUP = 0.1;

const name = "sponsored-oft" as const;

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm"],
  supports: {
    A2A: false,
    A2B: false,
    B2A: true,
    B2B: true,
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * Checks if a route is supported for sponsored OFT transfers.
 */
export function isRouteSupported(params: {
  inputToken: Token;
  outputToken: Token;
}): boolean {
  const { inputToken, outputToken } = params;

  // Check if input and output tokens are supported
  if (
    !SPONSORED_OFT_INPUT_TOKENS.includes(inputToken.symbol) ||
    !SPONSORED_OFT_OUTPUT_TOKENS.includes(outputToken.symbol)
  ) {
    return false;
  }

  // Check if destination chain is supported
  if (!SPONSORED_OFT_DESTINATION_CHAINS.includes(outputToken.chainId)) {
    return false;
  }

  // Check if OFT messenger exists for input chain
  const oftMessengers = OFT_MESSENGERS[inputToken.symbol];
  if (!oftMessengers || !oftMessengers[inputToken.chainId]) {
    return false;
  }

  // Check if source periphery exists for input chain
  if (!SPONSORED_OFT_SRC_PERIPHERY[inputToken.chainId]) {
    return false;
  }

  // Check if destination handler exists for intermediary chain
  const intermediaryChain = CHAIN_IDs.HYPEREVM;
  if (!DST_OFT_HANDLER[intermediaryChain]) {
    return false;
  }

  return true;
}

/**
 * Gets the intermediary token for sponsored OFT transfers.
 * All sponsored OFT transfers go through HyperEVM USDT as an intermediary
 * before reaching the final destination.
 */
async function getIntermediaryToken(): Promise<Token> {
  const hyperevmUsdtAddress =
    TOKEN_SYMBOLS_MAP.USDT.addresses[CHAIN_IDs.HYPEREVM];
  if (!hyperevmUsdtAddress) {
    throw new InvalidParamError({
      message: "HyperEVM USDT address not found",
    });
  }

  const tokenInfo = await getCachedTokenInfo({
    address: hyperevmUsdtAddress,
    chainId: CHAIN_IDs.HYPEREVM,
  });

  return tokenInfo;
}

/**
 * Gets a quote for an exact input amount (user specifies input, gets output)
 */
export async function getSponsoredOftQuoteForExactInput(
  params: GetExactInputBridgeQuoteParams
) {
  const { inputToken, outputToken, exactInputAmount, recipient } = params;

  // Get intermediary token (HyperEVM USDT)
  // All sponsored OFT transfers route through HyperEVM USDT before reaching final destination
  const intermediaryToken = await getIntermediaryToken();

  // The following composer options are used for the initial quote and are not used for
  // the final quote execution.
  const composerOptsForInitialQuote = getSponsoredOftComposerMessageForQuoting({
    nonce: generateQuoteNonce(params.recipient!),
    deadline: Math.floor(Date.now() / 1000),
    maxBpsToSponsor: BigNumber.from(0),
    maxUserSlippageBps: BigNumber.from(0),
    finalRecipient: toBytes32(recipient!),
    finalToken: toBytes32(outputToken.address),
    executionMode: ExecutionMode.Default,
    actionData: "0x",
  });

  // Get OFT quote to intermediary token and estimated fill time
  const [{ inputAmount, outputAmount, nativeFee }, estimatedFillTimeSec] =
    await Promise.all([
      getQuote({
        inputToken,
        outputToken: intermediaryToken,
        inputAmount: exactInputAmount,
        recipient: recipient!,
        composerOpts: {
          toAddress: recipient!,
          composeMsg: composerOptsForInitialQuote.composeMsg,
          extraOptions: composerOptsForInitialQuote.extraOptions,
        },
      }),
      getEstimatedFillTime(
        inputToken.chainId,
        intermediaryToken.chainId,
        inputToken.symbol
      ),
    ]);

  const nativeToken = getNativeTokenInfo(inputToken.chainId);

  // Convert output amount from intermediary token decimals to final output token decimals
  const finalOutputAmount = ConvertDecimals(
    intermediaryToken.decimals,
    outputToken.decimals
  )(outputAmount);

  return {
    bridgeQuote: {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: finalOutputAmount,
      minOutputAmount: finalOutputAmount,
      estimatedFillTimeSec,
      provider: name,
      fees: getOftBridgeFees({
        inputToken,
        nativeFee: addMarkupToAmount(
          nativeFee,
          INITIAL_QUOTE_NATIVE_FEE_MARKUP
        ),
        nativeToken,
      }),
    },
  };
}

/**
 * Gets a quote for a desired output amount (user specifies output, gets required input)
 */
export async function getSponsoredOftQuoteForOutput(
  params: GetOutputBridgeQuoteParams
) {
  const { inputToken, outputToken, minOutputAmount, recipient } = params;

  // Get intermediary token (HyperEVM USDT)
  // All sponsored OFT transfers route through HyperEVM USDT before reaching final destination
  const intermediaryToken = await getIntermediaryToken();

  // Convert minOutputAmount to input token decimals
  const minOutputInInputDecimals = ConvertDecimals(
    outputToken.decimals,
    inputToken.decimals
  )(minOutputAmount);

  // Get OFT quote to intermediary token and estimated fill time
  const [
    { inputAmount, outputAmount: intermediaryOutputAmount, nativeFee },
    estimatedFillTimeSec,
  ] = await Promise.all([
    getQuote({
      inputToken,
      outputToken: intermediaryToken,
      inputAmount: minOutputInInputDecimals,
      recipient: recipient!,
    }),
    getEstimatedFillTime(
      inputToken.chainId,
      intermediaryToken.chainId,
      inputToken.symbol
    ),
  ]);

  // Convert output amount from intermediary token decimals to output token decimals
  const finalOutputAmount = ConvertDecimals(
    intermediaryToken.decimals,
    outputToken.decimals
  )(intermediaryOutputAmount);

  // OFT precision limitations may prevent delivering the exact minimum amount
  // We validate against the rounded amount (maximum possible given shared decimals)
  const roundedMinOutputAmount = roundAmountToSharedDecimals(
    minOutputAmount,
    inputToken.symbol,
    inputToken.decimals
  );
  assertMinOutputAmount(finalOutputAmount, roundedMinOutputAmount);

  const nativeToken = getNativeTokenInfo(inputToken.chainId);

  return {
    bridgeQuote: {
      inputToken,
      outputToken,
      inputAmount,
      outputAmount: finalOutputAmount,
      minOutputAmount: finalOutputAmount,
      estimatedFillTimeSec,
      provider: name,
      fees: getOftBridgeFees({
        inputToken,
        nativeFee,
        nativeToken,
      }),
    },
  };
}

/**
 * Calculates the maximum basis points to sponsor for a given output token
 * @param outputTokenSymbol - The symbol of the output token (e.g., "USDT-SPOT", "USDC")
 * @param bridgeInputAmount - The input amount being bridged (in input token decimals)
 * @param bridgeOutputAmount - The output amount from the bridge (in intermediary token decimals)
 * @returns The maximum basis points to sponsor
 */
export async function calculateMaxBpsToSponsor(params: {
  outputTokenSymbol: string;
  bridgeInputAmount: BigNumber;
  bridgeOutputAmount: BigNumber;
}): Promise<BigNumber> {
  const { outputTokenSymbol, bridgeInputAmount, bridgeOutputAmount } = params;

  if (outputTokenSymbol === "USDT-SPOT") {
    // USDT -> USDT: 0 bps (no swap needed, no sponsorship needed)
    return BigNumber.from(0);
  }

  if (outputTokenSymbol === "USDC") {
    // USDT -> USDC: Calculate sponsorship needed to guarantee 1:1 output

    // Simulate the swap on HyperCore to get estimated output
    const simulation = await simulateMarketOrder({
      tokenIn: {
        symbol: "USDT",
        decimals: SPOT_TOKEN_DECIMALS, // Spot token decimals always 8
      },
      tokenOut: {
        symbol: "USDC",
        decimals: SPOT_TOKEN_DECIMALS, // Spot token decimals always 8
      },
      inputAmount: ConvertDecimals(
        TOKEN_SYMBOLS_MAP.USDT.decimals,
        SPOT_TOKEN_DECIMALS
      )(bridgeOutputAmount), // Convert USDT to USDT-SPOT, as `bridgeOutputAmount` is in USDT decimals
    });

    // Expected output (1:1): same amount as initial input after decimal conversion
    const expectedOutput = bridgeInputAmount;

    const swapOutput = simulation.outputAmount;
    const swapOutputInInputDecimals = ConvertDecimals(
      SPOT_TOKEN_DECIMALS,
      TOKEN_SYMBOLS_MAP.USDT.decimals
    )(swapOutput);

    // Calculate loss if swap output is less than expected
    if (swapOutputInInputDecimals.lt(expectedOutput)) {
      const loss = expectedOutput.sub(swapOutputInInputDecimals);
      // Loss as basis points: (loss / input) * 10000
      const lossBps = loss.mul(10000).div(bridgeInputAmount);
      return BigNumber.from(Math.ceil(lossBps.toNumber()));
    }

    // No loss or profit from swap, no sponsorship needed
    return BigNumber.from(0);
  }

  throw new InvalidParamError({
    message: `Unsupported output token: ${outputTokenSymbol}`,
  });
}

/**
 * Builds transaction for sponsored OFT flow
 */
async function buildTransaction(params: {
  crossSwap: CrossSwap;
  bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  integratorId?: string;
  isEligibleForSponsorship: boolean;
}) {
  const { crossSwap, bridgeQuote, integratorId, isEligibleForSponsorship } =
    params;

  const originChainId = crossSwap.inputToken.chainId;

  // Get source periphery contract address
  const srcPeripheryAddress = SPONSORED_OFT_SRC_PERIPHERY[originChainId];
  if (!srcPeripheryAddress) {
    throw new InvalidParamError({
      message: `Sponsored OFT source periphery not found for chain ${originChainId}`,
    });
  }

  const maxBpsToSponsor = isEligibleForSponsorship
    ? // If eligible for sponsorship, we calculate the maxBpsToSponsor based on output
      // token and market simulation.
      await calculateMaxBpsToSponsor({
        outputTokenSymbol: crossSwap.outputToken.symbol,
        bridgeInputAmount: bridgeQuote.inputAmount,
        bridgeOutputAmount: bridgeQuote.outputAmount,
      })
    : // If not eligible for sponsorship, we use 0 bps as maxBpsToSponsor. This will
      // trigger the un-sponsored flow in the destination periphery contract.
      BigNumber.from(0);

  // Convert slippage tolerance to bps (slippageTolerance is a decimal, e.g., 0.5 = 0.5% = 50 bps)
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

  // Build signed quote with signature
  const { quote, signature } = buildSponsoredOFTQuote({
    inputToken: crossSwap.inputToken,
    outputToken: crossSwap.outputToken,
    inputAmount: bridgeQuote.inputAmount,
    recipient: crossSwap.recipient,
    depositor: crossSwap.depositor,
    refundRecipient: getFallbackRecipient(crossSwap, crossSwap.recipient),
    maxBpsToSponsor,
    maxUserSlippageBps,
  });

  // Encode the deposit call
  const iface = new ethers.utils.Interface(SPONSORED_OFT_SRC_PERIPHERY_ABI);
  const callData = iface.encodeFunctionData("deposit", [quote, signature]);

  // Handle integrator ID and swap API marker tagging
  const callDataWithIntegratorId = integratorId
    ? tagIntegratorId(integratorId, callData)
    : callData;
  const callDataWithMarkers = tagSwapApiMarker(callDataWithIntegratorId);

  return {
    chainId: originChainId,
    from: crossSwap.depositor,
    to: srcPeripheryAddress,
    data: callDataWithMarkers,
    value: bridgeQuote.fees.amount, // Native fee for LayerZero
    ecosystem: "evm" as const,
  };
}

/**
 * OFT sponsored bridge strategy
 */
export function getOftSponsoredBridgeStrategy(
  isEligibleForSponsorship: boolean
): BridgeStrategy {
  return {
    name,
    capabilities,

    originTxNeedsAllowance: true,

    isRouteSupported: ({ inputToken, outputToken }) => {
      return isRouteSupported({ inputToken, outputToken });
    },

    getCrossSwapTypes: ({ inputToken, outputToken }) => {
      // Routes supported: USDT → USDT-SPOT or USDC
      if (
        inputToken.symbol === "USDT" &&
        (outputToken.symbol === "USDT-SPOT" || outputToken.symbol === "USDC")
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

    getQuoteForExactInput: getSponsoredOftQuoteForExactInput,

    getQuoteForOutput: getSponsoredOftQuoteForOutput,

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string;
    }) => {
      const {
        bridgeQuote,
        crossSwap,
        originSwapQuote,
        destinationSwapQuote,
        appFee,
      } = params.quotes;

      // Sponsored bridge validations
      if (appFee?.feeAmount.gt(0)) {
        throw new InvalidParamError({
          message: "App fee is not supported for sponsored bridge transfers",
        });
      }

      if (originSwapQuote || destinationSwapQuote) {
        throw new InvalidParamError({
          message:
            "Origin/destination swaps are not supported for sponsored bridge transfers",
        });
      }

      return buildTransaction({
        crossSwap,
        bridgeQuote,
        integratorId: params.integratorId,
        isEligibleForSponsorship,
      });
    },
  };
}
