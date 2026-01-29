import {
  BridgeStrategy,
  GetExactInputBridgeQuoteParams,
  BridgeCapabilities,
  GetOutputBridgeQuoteParams,
} from "../types";
import { CrossSwap, CrossSwapQuotes, Token } from "../../_dexes/types";
import { CROSS_SWAP_TYPE, AppFee } from "../../_dexes/utils";
import {
  getDepositMessage,
  isRouteSupported,
  getBridgeableOutputToken,
  getDepositRecipient,
  assertSupportedRoute,
} from "./utils/common";
import { SUPPORTED_INPUT_TOKENS } from "./utils/constants";
import { getUsdhIntentQuote } from "./utils/quote";
import { buildTxEvm, buildTxSvm } from "./utils/tx-builder";
import { ConvertDecimals } from "../../_utils";
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
    A2B: true, // Enable A2B flows for EVM origin chains
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

      // Check if input token is bridgeable (USDC/USDT)
      const isBridgeableInput = SUPPORTED_INPUT_TOKENS.some(
        (token) =>
          token.addresses[params.inputToken.chainId]?.toLowerCase() ===
          params.inputToken.address.toLowerCase()
      );

      // B2B flow: input is already bridgeable
      if (isBridgeableInput) {
        return [CROSS_SWAP_TYPE.BRIDGEABLE_TO_BRIDGEABLE];
      }

      // A2B flow: input needs to be swapped to bridgeable token
      return [CROSS_SWAP_TYPE.ANY_TO_BRIDGEABLE];
    },

    getBridgeQuoteRecipient: async (
      crossSwap: CrossSwap,
      _hasOriginSwap?: boolean
    ) => {
      return crossSwap.recipient;
    },

    getBridgeQuoteMessage: async (crossSwap: CrossSwap, _appFee?: AppFee) => {
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

    const acrossQuote = await getAcrossBridgeStrategy().getQuoteForExactInput({
      inputToken,
      outputToken: bridgeableOutputToken,
      exactInputAmount,
      recipient: depositRecipient,
      message: depositMessage,
    });

    return {
      bridgeQuote: {
        ...acrossQuote.bridgeQuote,
        inputToken,
        outputToken,
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

    const acrossQuote = await getAcrossBridgeStrategy().getQuoteForOutput({
      inputToken,
      outputToken: bridgeableOutputToken,
      minOutputAmount,
      recipient: depositRecipient,
      message: depositMessage,
    });

    return {
      bridgeQuote: {
        ...acrossQuote.bridgeQuote,
        inputToken,
        outputToken,
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
