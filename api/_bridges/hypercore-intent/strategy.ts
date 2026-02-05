import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import {
  CrossSwap,
  CrossSwapQuotes,
  SwapQuote,
  Token,
} from "../../_dexes/types";
import { CROSS_SWAP_TYPE, AppFee } from "../../_dexes/utils";
import {
  assertSupportedRoute,
  getBridgeableInputToken,
  getBridgeableOutputToken,
  getDepositMessage,
  getDepositRecipient,
  isRouteSupported,
} from "./utils/common";
import {
  BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN,
  INTERNALIZED_SWAP_PAIRS,
  SUPPORTED_OUTPUT_TOKENS,
} from "./utils/constants";
import {
  getUsdhIntentQuote,
  getEstimatedFillTimeToHyperEvm,
} from "./utils/quote";
import { buildTxEvm, buildTxSvm } from "./utils/tx-builder";
import { ConvertDecimals, getTokenByAddress } from "../../_utils";
import { getAcrossBridgeStrategy } from "../across/strategy";
import {
  assertAccountExistsOnHyperCore,
  isToHyperCore,
} from "../../_hypercore";

const SPONSORED_PROVIDER_NAME = "sponsored-intent" as const;
const UNSPONSORED_PROVIDER_NAME = "across" as const;

const capabilities: BridgeCapabilities = {
  ecosystems: ["evm", "svm"],
  supports: {
    A2A: false,
    A2B: true,
    B2A: false,
    B2B: true,
    B2BI: false,
    crossChainMessage: false,
  },
};

/**
 * This strategy implements USDC -> USDH on HyperEVM/HyperCore via Across Intents.
 * Supports both sponsored and unsponsored flows via isEligibleForSponsorship flag.
 */
export function getHyperCoreIntentBridgeStrategy(
  opt?: Partial<{
    isEligibleForSponsorship: boolean;
    shouldSponsorAccountCreation: boolean;
  }>
): BridgeStrategy {
  const isEligibleForSponsorship = opt?.isEligibleForSponsorship ?? false;
  const shouldSponsorAccountCreation =
    opt?.shouldSponsorAccountCreation ?? false;

  const name = isEligibleForSponsorship
    ? SPONSORED_PROVIDER_NAME
    : UNSPONSORED_PROVIDER_NAME;
  return {
    name,
    capabilities,

    originTxNeedsAllowance: true,

    getCrossSwapTypes: (params: {
      inputToken: Token;
      outputToken: Token;
      isInputNative: boolean;
      isOutputNative: boolean;
    }) => {
      if (
        !isRouteSupported({
          inputToken: params.inputToken,
          outputToken: params.outputToken,
        })
      ) {
        return [];
      }

      const supportedOutputToken = SUPPORTED_OUTPUT_TOKENS.find(
        (token) =>
          token.addresses[params.outputToken.chainId]?.toLowerCase() ===
          params.outputToken.address.toLowerCase()
      )!;

      const requiredBridgeableToken =
        BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN[
          supportedOutputToken.symbol as keyof typeof BRIDGEABLE_OUTPUT_TOKEN_PER_OUTPUT_TOKEN
        ]!;

      // Check if input token matches the required bridgeable token
      const inputMatchesBridgeableToken =
        requiredBridgeableToken.addresses[
          params.inputToken.chainId
        ]?.toLowerCase() === params.inputToken.address.toLowerCase();

      // Check if this is an internalized swap pair (e.g., USDC → USDH)
      const isInternalizedSwapPair = INTERNALIZED_SWAP_PAIRS.some(
        (pair) =>
          pair.inputToken === params.inputToken.symbol &&
          pair.outputToken === supportedOutputToken.symbol
      );

      if (inputMatchesBridgeableToken || isInternalizedSwapPair) {
        return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
      } else {
        return [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE];
      }
    },

    getBridgeQuoteRecipient: async (
      crossSwap: CrossSwap,
      _hasOriginSwap?: boolean
    ) => {
      return crossSwap.recipient;
    },

    getBridgeQuoteMessage: async (
      crossSwap: CrossSwap,
      _appFee?: AppFee,
      _originSwapQuote?: SwapQuote
    ) => {
      return getDepositMessage({
        outputToken: crossSwap.outputToken,
        recipient: crossSwap.recipient,
      });
    },

    getQuoteForExactInput: (params: GetExactInputBridgeQuoteParams) =>
      getQuoteForExactInput({
        ...params,
        isEligibleForSponsorship,
        shouldSponsorAccountCreation,
      }),

    getQuoteForOutput: (params: GetOutputBridgeQuoteParams) =>
      getQuoteForOutput({
        ...params,
        isEligibleForSponsorship,
        shouldSponsorAccountCreation,
      }),

    buildTxForAllowanceHolder: async (params: {
      quotes: CrossSwapQuotes;
      integratorId?: string | undefined;
    }) => {
      if (params.quotes.crossSwap.isOriginSvm) {
        return buildTxSvm(params);
      } else {
        return buildTxEvm(params);
      }
    },

    isRouteSupported,

    resolveOriginSwapTarget: (params: {
      inputToken: Token;
      outputToken: Token;
    }) => {
      // Get output token info
      const outputTokenInfo = getTokenByAddress(
        params.outputToken.address,
        params.outputToken.chainId
      );

      if (!outputTokenInfo) return undefined;

      const bridgeableInputToken = getBridgeableInputToken(
        params.inputToken.chainId,
        params.outputToken
      );

      return bridgeableInputToken;
    },
  };
}

/**
 * Get quote for exact input amount.
 * Routes between sponsored (zero fees) and unsponsored (Across fees) flows.
 */
export async function getQuoteForExactInput(
  params: GetExactInputBridgeQuoteParams & {
    isEligibleForSponsorship: boolean;
    shouldSponsorAccountCreation: boolean;
  }
): Promise<{ bridgeQuote: CrossSwapQuotes["bridgeQuote"] }> {
  const { inputToken, outputToken, exactInputAmount, recipient } = params;

  assertSupportedRoute({ inputToken, outputToken });

  if (
    isToHyperCore(outputToken.chainId) &&
    !params.shouldSponsorAccountCreation
  ) {
    await assertAccountExistsOnHyperCore({
      account: recipient,
      chainId: outputToken.chainId,
      paramName: "recipient",
    });
  }

  if (params.isEligibleForSponsorship) {
    // Sponsored flow: use zero fees and 1:1 conversion
    const sponsoredQuote = await getUsdhIntentQuote({
      inputToken,
      outputToken,
      exactInputAmount,
      recipient,
    });

    return {
      bridgeQuote: {
        inputToken,
        outputToken,
        inputAmount: sponsoredQuote.inputAmount,
        outputAmount: sponsoredQuote.outputAmount,
        minOutputAmount: sponsoredQuote.minOutputAmount,
        estimatedFillTimeSec: sponsoredQuote.estimatedFillTimeSec,
        provider: SPONSORED_PROVIDER_NAME,
        fees: sponsoredQuote.fees,
      },
    };
  } else {
    // Unsponsored flow: delegate to Across strategy for fee calculation
    const bridgeableOutputToken = getBridgeableOutputToken(outputToken);
    const depositRecipient = getDepositRecipient({ outputToken, recipient });
    const depositMessage = getDepositMessage({ outputToken, recipient });

    const [acrossQuote, estimatedFillTimeSec] = await Promise.all([
      getAcrossBridgeStrategy().getQuoteForExactInput({
        inputToken,
        outputToken: bridgeableOutputToken,
        exactInputAmount,
        recipient: depositRecipient,
        message: depositMessage,
      }),
      getEstimatedFillTimeToHyperEvm({
        inputToken,
        outputToken,
        inputAmount: exactInputAmount,
      }),
    ]);

    return {
      bridgeQuote: {
        ...acrossQuote.bridgeQuote,
        inputToken,
        outputToken,
        estimatedFillTimeSec,
        // Convert outputAmount from bridgeable token decimals to output token decimals
        outputAmount: ConvertDecimals(
          bridgeableOutputToken.decimals,
          outputToken.decimals
        )(acrossQuote.bridgeQuote.outputAmount),
        minOutputAmount: ConvertDecimals(
          bridgeableOutputToken.decimals,
          outputToken.decimals
        )(acrossQuote.bridgeQuote.minOutputAmount),
      },
    };
  }
}

/**
 * Get quote for output amount.
 * Routes between sponsored (zero fees) and unsponsored (Across fees) flows.
 */
export async function getQuoteForOutput(
  params: GetOutputBridgeQuoteParams & {
    isEligibleForSponsorship: boolean;
    shouldSponsorAccountCreation: boolean;
  }
): Promise<{ bridgeQuote: CrossSwapQuotes["bridgeQuote"] }> {
  const { inputToken, outputToken, minOutputAmount, recipient } = params;

  assertSupportedRoute({ inputToken, outputToken });

  if (
    isToHyperCore(outputToken.chainId) &&
    !params.shouldSponsorAccountCreation
  ) {
    await assertAccountExistsOnHyperCore({
      account: recipient,
      chainId: outputToken.chainId,
      paramName: "recipient",
    });
  }

  if (params.isEligibleForSponsorship) {
    // Sponsored flow: convert output amount to input amount (1:1 conversion)
    const inputAmount = ConvertDecimals(
      outputToken.decimals,
      inputToken.decimals
    )(minOutputAmount);

    // Get sponsored quote with the converted input amount
    const sponsoredQuote = await getUsdhIntentQuote({
      inputToken,
      outputToken,
      exactInputAmount: inputAmount,
      recipient,
    });

    return {
      bridgeQuote: {
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: sponsoredQuote.outputAmount,
        minOutputAmount,
        estimatedFillTimeSec: sponsoredQuote.estimatedFillTimeSec,
        provider: SPONSORED_PROVIDER_NAME,
        fees: sponsoredQuote.fees,
      },
    };
  } else {
    // Unsponsored flow: delegate to Across strategy for fee calculation
    const bridgeableOutputToken = getBridgeableOutputToken(outputToken);
    const depositRecipient = getDepositRecipient({ outputToken, recipient });
    const depositMessage = getDepositMessage({ outputToken, recipient });

    // Convert minOutputAmount from output token decimals to bridgeable token decimals
    const minOutputAmountInBridgeableDecimals = ConvertDecimals(
      outputToken.decimals,
      bridgeableOutputToken.decimals
    )(minOutputAmount);

    const [acrossQuote, estimatedFillTimeSec] = await Promise.all([
      getAcrossBridgeStrategy().getQuoteForOutput({
        inputToken,
        outputToken: bridgeableOutputToken,
        minOutputAmount: minOutputAmountInBridgeableDecimals,
        recipient: depositRecipient,
        message: depositMessage,
      }),
      getEstimatedFillTimeToHyperEvm({
        inputToken,
        outputToken,
        // Use minOutputAmount converted to input token decimals as an approximation
        inputAmount: ConvertDecimals(
          outputToken.decimals,
          inputToken.decimals
        )(minOutputAmount),
      }),
    ]);

    return {
      bridgeQuote: {
        ...acrossQuote.bridgeQuote,
        inputToken,
        outputToken,
        estimatedFillTimeSec,
        // Convert outputAmount from bridgeable token decimals to output token decimals
        outputAmount: ConvertDecimals(
          bridgeableOutputToken.decimals,
          outputToken.decimals
        )(acrossQuote.bridgeQuote.outputAmount),
        minOutputAmount: ConvertDecimals(
          bridgeableOutputToken.decimals,
          outputToken.decimals
        )(acrossQuote.bridgeQuote.minOutputAmount),
      },
    };
  }
}
