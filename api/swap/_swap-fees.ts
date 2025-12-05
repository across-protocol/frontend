import { BigNumber, ethers, utils } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { getCachedTokenPrice } from "../_utils";
import { BridgeProvider, Token } from "../_dexes/types";
import { SwapQuote } from "../_dexes/types";
import { AppFee } from "../_dexes/utils";
import {
  IndirectDestinationRoute,
  CrossSwapQuotes,
  FeeDetailsType,
} from "../_dexes/types";
import { Logger } from "@across-protocol/sdk/dist/types/relayFeeCalculator";
import { getNativeTokenInfo } from "../_token-info";

export type FeeComponent<
  T extends
    | AcrossBridgeFeeDetails
    | TotalFeeBreakdownDetails
    | MaxTotalFeeBreakdownDetails
    | undefined = undefined,
> = {
  amount: BigNumber;
  amountUsd: string;
  token: Token;
  pct?: BigNumber;
  inputAmountUsd?: number;
  details?: T;
};

type AcrossBridgeFeeDetails = {
  type: FeeDetailsType.ACROSS;
  lp: FeeComponent;
  relayerCapital: FeeComponent;
  destinationGas: FeeComponent;
};

type TotalFeeBreakdownDetails = {
  type: FeeDetailsType.TOTAL_BREAKDOWN;
  swapImpact: FeeComponent;
  app: FeeComponent;
  bridge: FeeComponent<AcrossBridgeFeeDetails> | FeeComponent;
};

type MaxTotalFeeBreakdownDetails = {
  type: FeeDetailsType.MAX_TOTAL_BREAKDOWN;
  maxSwapImpact: FeeComponent;
  app: FeeComponent;
  bridge: FeeComponent<AcrossBridgeFeeDetails> | FeeComponent;
};

export type SwapFees = {
  total: FeeComponent<TotalFeeBreakdownDetails>;
  totalMax: FeeComponent<MaxTotalFeeBreakdownDetails>;
  originGas: FeeComponent;
};

const PRICE_DIFFERENCE_TOLERANCE = 0.01;

export async function calculateSwapFees(params: {
  inputAmount: BigNumber;
  originSwapQuote?: SwapQuote;
  bridgeQuote: CrossSwapQuotes["bridgeQuote"];
  destinationSwapQuote?: SwapQuote;
  appFeePercent?: number;
  appFee?: AppFee;
  originTxGas?: BigNumber;
  originTxGasPrice?: BigNumber;
  inputTokenPriceUsd: number;
  outputTokenPriceUsd: number;
  originNativePriceUsd: number;
  destinationNativePriceUsd: number;
  bridgeQuoteInputTokenPriceUsd: number;
  appFeeTokenPriceUsd: number;
  minOutputAmountSansAppFees: BigNumber;
  expectedOutputAmountSansAppFees: BigNumber;
  originChainId: number;
  destinationChainId: number;
  indirectDestinationRoute?: IndirectDestinationRoute;
  logger: Logger;
  bridgeProvider?: BridgeProvider;
}): Promise<SwapFees | undefined> {
  const {
    inputAmount,
    originSwapQuote,
    bridgeQuote,
    destinationSwapQuote,
    appFee,
    originTxGas,
    originTxGasPrice,
    inputTokenPriceUsd: _inputTokenPriceUsd,
    outputTokenPriceUsd: _outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
    appFeeTokenPriceUsd,
    minOutputAmountSansAppFees,
    expectedOutputAmountSansAppFees,
    originChainId,
    destinationChainId,
    indirectDestinationRoute,
    logger,
    bridgeProvider = "across",
  } = params;

  try {
    if (
      _inputTokenPriceUsd === 0 ||
      _outputTokenPriceUsd === 0 ||
      originNativePriceUsd === 0 ||
      destinationNativePriceUsd === 0 ||
      bridgeQuoteInputTokenPriceUsd === 0
    ) {
      logger.debug({
        at: "calculateSwapFees",
        message: "Error calculating swap fees. Could not resolve USD prices.",
        _inputTokenPriceUsd,
        _outputTokenPriceUsd,
        originNativePriceUsd,
        destinationNativePriceUsd,
        bridgeQuoteInputTokenPriceUsd,
      });
      return undefined;
    }

    const inputToken = originSwapQuote?.tokenIn ?? bridgeQuote.inputToken;
    const outputToken =
      destinationSwapQuote?.tokenOut ?? bridgeQuote.outputToken;

    const priceDifference = Math.abs(
      _inputTokenPriceUsd - _outputTokenPriceUsd
    );
    const priceDifferencePercentage = priceDifference / _inputTokenPriceUsd;

    let inputTokenPriceUsd = _inputTokenPriceUsd;
    let outputTokenPriceUsd = _outputTokenPriceUsd;

    if (
      inputToken.symbol === outputToken.symbol &&
      (priceDifferencePercentage > PRICE_DIFFERENCE_TOLERANCE ||
        outputTokenPriceUsd > inputTokenPriceUsd)
    ) {
      [inputTokenPriceUsd, outputTokenPriceUsd] = await Promise.all([
        getCachedTokenPrice({
          symbol: inputToken.symbol,
          tokenAddress: inputToken.address,
          chainId: inputToken.chainId,
          fallbackResolver: "lifi",
        }),
        getCachedTokenPrice({
          symbol: outputToken.symbol,
          tokenAddress: outputToken.address,
          chainId: outputToken.chainId,
          fallbackResolver: "lifi",
        }),
      ]);

      if (
        priceDifferencePercentage > PRICE_DIFFERENCE_TOLERANCE ||
        outputTokenPriceUsd > inputTokenPriceUsd ||
        outputTokenPriceUsd === 0 ||
        inputTokenPriceUsd === 0
      ) {
        logger.debug({
          at: "calculateSwapFees",
          message:
            "Error calculating swap fees. USD prices are not consistent.",
          _inputTokenPriceUsd,
          _outputTokenPriceUsd,
          inputTokenPriceUsd,
          outputTokenPriceUsd,
        });
        return undefined;
      }
    }

    const inputAmountUsd =
      parseFloat(utils.formatUnits(inputAmount, inputToken.decimals)) *
      inputTokenPriceUsd;

    const originGas =
      originTxGas && originTxGasPrice
        ? originTxGas.mul(originTxGasPrice)
        : BigNumber.from(0);
    const originGasToken = getNativeTokenInfo(originChainId);
    const originGasUsd =
      parseFloat(utils.formatUnits(originGas, originGasToken.decimals)) *
      originNativePriceUsd;
    const originGasComponent = formatFeeComponent({
      amount: originGas,
      amountUsd: originGasUsd,
      token: originGasToken,
    });

    const destinationGasToken = getNativeTokenInfo(
      indirectDestinationRoute?.intermediaryOutputToken.chainId ??
        destinationChainId
    );

    const appFeeAmount = appFee?.feeAmount || BigNumber.from(0);
    const appFeeToken = appFee?.feeToken || outputToken;
    const appFeeUsd =
      parseFloat(utils.formatUnits(appFeeAmount, appFeeToken.decimals)) *
      appFeeTokenPriceUsd;
    const appFeeComponent = formatFeeComponent({
      amount: appFeeAmount,
      amountUsd: appFeeUsd,
      token: appFeeToken,
      inputAmountUsd,
    });

    // Overall bridge fees, can be 'across' or other bridge provider incurred fees
    const bridgeFees = bridgeQuote.fees;
    const bridgeFeesTokenPriceUsd = await getBridgeFeesTokenPriceUsd({
      bridgeFees,
      bridgeQuoteInputToken: bridgeQuote.inputToken,
      originChainId,
      originNativePriceUsd,
      bridgeQuoteInputTokenPriceUsd,
      originGasToken,
    });
    const bridgeFeesUsd =
      parseFloat(
        utils.formatUnits(bridgeFees.amount, bridgeFees.token.decimals)
      ) * bridgeFeesTokenPriceUsd;
    const bridgeFeeDetails = formatBridgeFeesDetails({
      bridgeFees,
      bridgeQuoteInputTokenPriceUsd,
      inputAmountUsd,
      destinationNativePriceUsd,
      destinationGasToken,
    });
    const bridgeFeeComponent = {
      ...formatFeeComponent({
        amount: bridgeFees.amount,
        amountUsd: bridgeFeesUsd,
        token: bridgeFees.token,
        inputAmountUsd,
      }),
      details: bridgeFeeDetails,
    };

    // Calculate `maxTotalFee` and `maxSwapImpact`
    const outputMinAmountSansAppFeesUsd =
      parseFloat(
        utils.formatUnits(
          minOutputAmountSansAppFees,
          indirectDestinationRoute?.outputToken.decimals ?? outputToken.decimals
        )
      ) * outputTokenPriceUsd;
    const maxTotalFeeUsd = getTotalFeeUsd({
      bridgeProvider,
      bridgeFeesUsd,
      inputAmountUsd,
      outputAmountSansAppFeesUsd: outputMinAmountSansAppFeesUsd,
    });
    const { amount: maxTotalFeeAmount } = usdFeesToAmountAndPct({
      feesUsd: maxTotalFeeUsd,
      inputAmountUsd,
      inputAmount,
    });
    const maxSwapImpactUsd = maxTotalFeeUsd - bridgeFeesUsd - appFeeUsd;
    const { amount: maxSwapImpactAmount } = usdFeesToAmountAndPct({
      feesUsd: maxSwapImpactUsd,
      inputAmountUsd,
      inputAmount,
    });
    const maxSwapImpactComponent = formatFeeComponent({
      amount: maxSwapImpactAmount,
      amountUsd: maxSwapImpactUsd,
      token: inputToken,
      inputAmountUsd,
    });

    // Calculate `totalFee` and `swapImpact`
    const expectedOutputAmountSansAppFeesUsd =
      parseFloat(
        utils.formatUnits(
          expectedOutputAmountSansAppFees,
          indirectDestinationRoute?.outputToken.decimals ?? outputToken.decimals
        )
      ) * outputTokenPriceUsd;

    const expectedTotalFeeUsd = getTotalFeeUsd({
      bridgeProvider,
      bridgeFeesUsd,
      inputAmountUsd,
      outputAmountSansAppFeesUsd: expectedOutputAmountSansAppFeesUsd,
    });
    const { amount: expectedTotalFeeAmount } = usdFeesToAmountAndPct({
      feesUsd: expectedTotalFeeUsd,
      inputAmountUsd,
      inputAmount,
    });
    const swapImpactUsd = expectedTotalFeeUsd - bridgeFeesUsd - appFeeUsd;
    const { amount: swapImpactAmount } = usdFeesToAmountAndPct({
      feesUsd: swapImpactUsd,
      inputAmountUsd,
      inputAmount,
    });
    const swapImpactComponent = formatFeeComponent({
      amount: swapImpactAmount,
      amountUsd: swapImpactUsd,
      token: inputToken,
      inputAmountUsd,
    });

    // Format total fee breakdown details
    const totalFeeBreakdownDetails: TotalFeeBreakdownDetails = {
      type: FeeDetailsType.TOTAL_BREAKDOWN,
      swapImpact: swapImpactComponent,
      app: appFeeComponent,
      bridge: bridgeFeeComponent,
    };

    // Format max total fee breakdown details
    const maxTotalFeeBreakdownDetails: MaxTotalFeeBreakdownDetails = {
      type: FeeDetailsType.MAX_TOTAL_BREAKDOWN,
      maxSwapImpact: maxSwapImpactComponent,
      app: appFeeComponent,
      bridge: bridgeFeeComponent,
    };

    return {
      total: {
        ...formatFeeComponent({
          amount: expectedTotalFeeAmount,
          amountUsd: expectedTotalFeeUsd,
          token: inputToken,
          inputAmountUsd,
        }),
        details: totalFeeBreakdownDetails,
      },
      totalMax: {
        ...formatFeeComponent({
          amount: maxTotalFeeAmount,
          amountUsd: maxTotalFeeUsd,
          token: inputToken,
          inputAmountUsd,
        }),
        details: maxTotalFeeBreakdownDetails,
      },
      originGas: originGasComponent,
    };
  } catch (error) {
    logger.debug({
      at: "calculateSwapFees",
      message: "Error calculating swap fees",
      error,
    });
    return undefined;
  }
}

async function getBridgeFeesTokenPriceUsd(params: {
  bridgeFees: CrossSwapQuotes["bridgeQuote"]["fees"];
  bridgeQuoteInputToken: Token;
  originChainId: number;
  originNativePriceUsd: number;
  bridgeQuoteInputTokenPriceUsd: number;
  originGasToken: Token;
}) {
  const {
    bridgeFees,
    bridgeQuoteInputToken,
    originChainId,
    originNativePriceUsd,
    bridgeQuoteInputTokenPriceUsd,
    originGasToken,
  } = params;

  if (bridgeFees.amount.isZero()) {
    return 0;
  }

  if (
    bridgeFees.token.chainId === originChainId &&
    bridgeFees.token.symbol === originGasToken.symbol
  ) {
    return originNativePriceUsd;
  }

  if (bridgeFees.token.symbol === bridgeQuoteInputToken.symbol) {
    return bridgeQuoteInputTokenPriceUsd;
  }

  return await getCachedTokenPrice({
    symbol: bridgeFees.token.symbol,
    tokenAddress: bridgeFees.token.address,
    chainId: bridgeFees.token.chainId,
  });
}

function formatBridgeFeesDetails(params: {
  bridgeFees: CrossSwapQuotes["bridgeQuote"]["fees"];
  bridgeQuoteInputTokenPriceUsd: number;
  inputAmountUsd: number;
  destinationNativePriceUsd: number;
  destinationGasToken: Token;
}) {
  const {
    bridgeFees,
    bridgeQuoteInputTokenPriceUsd,
    inputAmountUsd,
    destinationNativePriceUsd,
    destinationGasToken,
  } = params;

  if (bridgeFees.details?.type !== FeeDetailsType.ACROSS) {
    return undefined;
  }

  const bridgeFeesToken = bridgeFees.token;
  const { lp, relayerCapital, destinationGas } = bridgeFees.details;

  // We need to use bridge input token price for destination gas since
  // suggested fees returns the gas total in input token decimals
  const destinationGasUsd =
    parseFloat(
      utils.formatUnits(destinationGas.amount, bridgeFeesToken.decimals)
    ) * bridgeQuoteInputTokenPriceUsd;
  const relayerCapitalUsd =
    parseFloat(
      utils.formatUnits(relayerCapital.amount, bridgeFeesToken.decimals)
    ) * bridgeQuoteInputTokenPriceUsd;
  const lpFeeUsd =
    parseFloat(utils.formatUnits(lp.amount, bridgeFeesToken.decimals)) *
    bridgeQuoteInputTokenPriceUsd;

  return {
    type: FeeDetailsType.ACROSS,
    lp: formatFeeComponent({
      amount: lp.amount,
      amountUsd: lpFeeUsd,
      token: bridgeFeesToken,
      inputAmountUsd,
    }),
    relayerCapital: formatFeeComponent({
      amount: relayerCapital.amount,
      amountUsd: relayerCapitalUsd,
      token: bridgeFeesToken,
      inputAmountUsd,
    }),
    destinationGas: formatFeeComponent({
      amount: safeUsdToTokenAmount(
        destinationGasUsd,
        destinationNativePriceUsd,
        destinationGasToken.decimals
      ),
      amountUsd: destinationGasUsd,
      token: destinationGasToken,
      inputAmountUsd,
    }),
  } as AcrossBridgeFeeDetails;
}

/**
 * Helper function to format fee components with consistent structure
 * @param amount - Fee amount in token units (BigNumber)
 * @param amountUsd - Fee amount in USD
 * @param token - Token information
 * @param inputAmountUsd - Total input amount in USD (for percentage calculation). Omit to exclude pct field.
 * @returns Formatted fee object with amount, amountUsd, pct (if inputAmountUsd provided), and token
 */
function formatFeeComponent(params: {
  amount: BigNumber;
  amountUsd: number;
  token: Token;
  inputAmountUsd?: number;
}) {
  const DEFAULT_PRECISION = 18;
  const { amount, amountUsd, token, inputAmountUsd } = params;

  const result: {
    amount: BigNumber;
    amountUsd: string;
    pct?: BigNumber;
    token: Token;
  } = {
    amount,
    amountUsd: ethers.utils.formatEther(
      ethers.utils.parseEther(amountUsd.toFixed(DEFAULT_PRECISION))
    ),
    token,
  };

  if (inputAmountUsd !== undefined) {
    result.pct = ethers.utils.parseEther(
      (amountUsd / inputAmountUsd).toFixed(DEFAULT_PRECISION)
    );
  }

  return result;
}

function safeUsdToTokenAmount(
  usdAmount: number,
  tokenPriceUsd: number,
  decimals: number
) {
  if (tokenPriceUsd === 0) return utils.parseUnits("0", decimals);
  const tokenAmount = usdAmount / tokenPriceUsd;
  if (tokenAmount <= 0 || isNaN(tokenAmount) || !isFinite(tokenAmount)) {
    return utils.parseUnits("0", decimals);
  }
  return utils.parseUnits(
    tokenAmount.toFixed(Math.min(decimals, 18)),
    decimals
  );
}

function usdFeesToAmountAndPct(params: {
  feesUsd: number;
  inputAmountUsd: number;
  inputAmount: BigNumber;
}) {
  if (params.inputAmountUsd <= 0) {
    return {
      amount: BigNumber.from(0),
      pct: BigNumber.from(0),
    };
  }

  const usdFeesPct = params.feesUsd / params.inputAmountUsd;
  const usdFeesAmount = params.inputAmount
    .mul(utils.parseEther(usdFeesPct.toFixed(18)))
    .div(sdk.utils.fixedPointAdjustment);
  return {
    amount: usdFeesAmount,
    pct: usdFeesPct,
  };
}

function getTotalFeeUsd(params: {
  bridgeProvider: BridgeProvider;
  bridgeFeesUsd: number;
  inputAmountUsd: number;
  outputAmountSansAppFeesUsd: number;
}) {
  const {
    bridgeProvider,
    bridgeFeesUsd,
    inputAmountUsd,
    outputAmountSansAppFeesUsd,
  } = params;

  if (bridgeProvider === "sponsored-intent") {
    return 0;
  }

  if (bridgeProvider === "oft" || bridgeProvider === "cctp") {
    return bridgeFeesUsd;
  }

  return parseFloat((inputAmountUsd - outputAmountSansAppFeesUsd).toFixed(4));
}
