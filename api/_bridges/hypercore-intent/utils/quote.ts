import { BigNumber, constants, utils } from "ethers";
import * as sdk from "@across-protocol/sdk";

import { Token } from "../../../_dexes/types";
import {
  getHyperEvmChainId,
  getBridgeableOutputToken,
  assertSupportedRoute,
  assertSufficientBalanceOnHyperEvm,
  getDepositRecipient,
  getDepositMessage,
  getZeroBridgeFees,
} from "./common";
import {
  ConvertDecimals,
  getCachedTokenPrice,
  getRelayerFeeDetails,
} from "../../../_utils";
import { getDefaultRelayerAddress } from "../../../_relayer-address";
import {
  GetExactInputBridgeQuoteParams,
  GetOutputBridgeQuoteParams,
} from "../../types";
import {
  ERROR_MESSAGE_PREFIX,
  USDH_FILL_DESTINATION_GAS_LIMIT_USD,
} from "./constants";
import {
  InvalidParamError,
  SwapAmountTooLowForBridgeFeesError,
} from "../../../_errors";
import { resolveTiming } from "../../../_timings";

export async function getRelayerFeeDetailsOnHyperEvm(params: {
  inputToken: Token;
  amount: BigNumber;
  outputToken: Token;
  recipient: string;
  message: string;
  outputTokenPriceNative: number;
}) {
  const hyperEvmChainId = getHyperEvmChainId(params.outputToken.chainId);
  const bridgeableOutputToken = getBridgeableOutputToken(params.outputToken);
  return getRelayerFeeDetails(
    {
      originChainId: params.inputToken.chainId,
      destinationChainId: hyperEvmChainId,
      recipientAddress: params.recipient,
      inputToken: params.inputToken.address,
      outputToken: bridgeableOutputToken.address,
      amount: params.amount,
      message: params.message,
    },
    params.outputTokenPriceNative,
    getDefaultRelayerAddress(hyperEvmChainId, bridgeableOutputToken.symbol)
  );
}

/**
 * Calculates the output amount after deducting relay fees.
 * Throws an error if the amount after fees is zero or negative.
 */
function calculateOutputAfterFees(params: {
  inputAmount: BigNumber;
  relayerFeeDetails: Awaited<ReturnType<typeof getRelayerFeeDetailsOnHyperEvm>>;
  inputToken: Token;
  outputToken: Token;
}): { outputAmount: BigNumber; totalFees: BigNumber; feePct: BigNumber } {
  const totalFees = BigNumber.from(params.relayerFeeDetails.relayFeeTotal);
  const amountAfterFees = params.inputAmount.sub(totalFees);

  if (amountAfterFees.lte(0)) {
    throw new SwapAmountTooLowForBridgeFeesError({
      bridgeAmount: utils.formatUnits(
        params.inputAmount,
        params.inputToken.decimals
      ),
      bridgeFee: utils.formatUnits(totalFees, params.inputToken.decimals),
    });
  }

  const outputAmount = ConvertDecimals(
    params.inputToken.decimals,
    params.outputToken.decimals
  )(amountAfterFees);

  const feePct = BigNumber.from(params.relayerFeeDetails.relayFeePercent);

  return { outputAmount, totalFees, feePct };
}

/**
 * Calculates the estimated fill time for a USDH quote.
 * Converts input amount to USD and uses the timing resolver.
 */
function calculateEstimatedFillTime(params: {
  inputToken: Token;
  inputAmount: BigNumber;
  inputTokenPriceUsd: number;
  hyperEvmChainId: number;
}): number {
  const inputAmountUsd = params.inputAmount
    .mul(utils.parseUnits(params.inputTokenPriceUsd.toString()))
    .div(utils.parseUnits("1", params.inputToken.decimals));

  return resolveTiming(
    String(params.inputToken.chainId),
    String(params.hyperEvmChainId),
    params.inputToken.symbol,
    inputAmountUsd
  );
}

/**
 * Builds the suggestedFees structure required for unsponsored USDH quotes.
 */
function buildSuggestedFeesForUsdh(params: {
  relayerFeeDetails: Awaited<ReturnType<typeof getRelayerFeeDetailsOnHyperEvm>>;
  outputAmount: BigNumber;
  estimatedFillTimeSec: number;
}) {
  return {
    estimatedFillTimeSec: params.estimatedFillTimeSec,
    timestamp: Math.floor(Date.now() / 1000),
    isAmountTooLow: params.relayerFeeDetails.isAmountTooLow,
    quoteBlock: "0", // Not applicable for manual fee calculation
    exclusiveRelayer: constants.AddressZero,
    exclusivityDeadline: 0,
    spokePoolAddress: constants.AddressZero,
    destinationSpokePoolAddress: constants.AddressZero,
    totalRelayFee: {
      pct: params.relayerFeeDetails.relayFeePercent,
      total: params.relayerFeeDetails.relayFeeTotal,
    },
    relayerCapitalFee: {
      pct: params.relayerFeeDetails.capitalFeePercent,
      total: params.relayerFeeDetails.capitalFeeTotal,
    },
    relayerGasFee: {
      pct: params.relayerFeeDetails.gasFeePercent,
      total: params.relayerFeeDetails.gasFeeTotal,
    },
    lpFee: {
      pct: "0",
      total: "0",
    },
    limits: {
      minDeposit: params.relayerFeeDetails.minDeposit,
      maxDeposit: "0", // Not applicable for manual fee calculation
      maxDepositInstant: "0",
      maxDepositShortDelay: "0",
      recommendedDepositInstant: "0",
    },
    outputAmount: params.outputAmount.toString(),
  };
}

export async function getUsdhIntentQuote({
  inputToken,
  outputToken,
  exactInputAmount,
  recipient,
}: GetExactInputBridgeQuoteParams) {
  assertSupportedRoute({ inputToken, outputToken });

  const hyperEvmChainId = getHyperEvmChainId(outputToken.chainId);
  const bridgeableOutputToken = getBridgeableOutputToken(outputToken);

  const outputAmountHyperEvm = ConvertDecimals(
    inputToken.decimals,
    bridgeableOutputToken.decimals
  )(exactInputAmount);
  const outputAmount = ConvertDecimals(
    inputToken.decimals,
    outputToken.decimals
  )(exactInputAmount);

  const [outputTokenPriceNative, inputTokenPriceUsd] = await Promise.all([
    getCachedTokenPrice({
      symbol: bridgeableOutputToken.symbol,
      baseCurrency: sdk.utils
        .getNativeTokenSymbol(hyperEvmChainId)
        .toLowerCase(),
    }),
    getCachedTokenPrice({
      symbol: inputToken.symbol,
      baseCurrency: "usd",
    }),
    assertSufficientBalanceOnHyperEvm({
      amountHyperEvm: outputAmountHyperEvm,
      inputToken,
      outputToken,
    }),
  ]);

  const depositRecipient = getDepositRecipient({
    outputToken,
    recipient,
  });
  const depositMessage = getDepositMessage({
    outputToken,
    recipient,
  });

  // Simulate USDH fill on  HyperEVM
  const relayerFeeDetails = await getRelayerFeeDetailsOnHyperEvm({
    inputToken,
    outputToken,
    amount: exactInputAmount,
    recipient: depositRecipient,
    message: depositMessage,
    outputTokenPriceNative,
  });

  // Check gas cost within limits
  const destinationGasUsd = BigNumber.from(relayerFeeDetails.gasFeeTotal)
    .mul(utils.parseEther("1"))
    .div(utils.parseUnits(inputTokenPriceUsd.toString()));
  if (
    destinationGasUsd.gt(
      utils.parseUnits(USDH_FILL_DESTINATION_GAS_LIMIT_USD.toString())
    )
  ) {
    throw new InvalidParamError({
      message: `${
        ERROR_MESSAGE_PREFIX
      }: Destination gas cost ${destinationGasUsd.toString()} USD is too high. Max is ${
        USDH_FILL_DESTINATION_GAS_LIMIT_USD
      } USD`,
    });
  }

  const estimatedFillTimeSec = calculateEstimatedFillTime({
    inputToken,
    inputAmount: exactInputAmount,
    inputTokenPriceUsd,
    hyperEvmChainId,
  });

  return {
    inputToken: inputToken,
    outputToken: outputToken,
    inputAmount: exactInputAmount,
    outputAmount,
    minOutputAmount: outputAmount,
    estimatedFillTimeSec,
    fees: getZeroBridgeFees(inputToken),
    message: depositMessage,
  };
}

export async function getUsdhUnsponsoredQuote({
  inputToken,
  outputToken,
  exactInputAmount,
  recipient,
}: GetExactInputBridgeQuoteParams) {
  assertSupportedRoute({ inputToken, outputToken });

  const hyperEvmChainId = getHyperEvmChainId(outputToken.chainId);
  const bridgeableOutputToken = getBridgeableOutputToken(outputToken); // USDH

  // 1. Get token prices and validate balance
  const [outputTokenPriceNative, inputTokenPriceUsd] = await Promise.all([
    getCachedTokenPrice({
      symbol: bridgeableOutputToken.symbol,
      baseCurrency: sdk.utils
        .getNativeTokenSymbol(hyperEvmChainId)
        .toLowerCase(),
    }),
    getCachedTokenPrice({
      symbol: inputToken.symbol,
      baseCurrency: "usd",
    }),
    assertSufficientBalanceOnHyperEvm({
      amountHyperEvm: ConvertDecimals(
        inputToken.decimals,
        bridgeableOutputToken.decimals
      )(exactInputAmount),
      inputToken,
      outputToken,
    }),
  ]);

  const depositRecipient = getDepositRecipient({ outputToken, recipient });
  const depositMessage = getDepositMessage({ outputToken, recipient });

  // 2. Calculate fees for USDH fill on HyperEVM
  const relayerFeeDetails = await getRelayerFeeDetailsOnHyperEvm({
    inputToken,
    outputToken,
    amount: exactInputAmount,
    recipient: depositRecipient,
    message: depositMessage,
    outputTokenPriceNative,
  });

  // 3. Calculate output amount = input - fees
  const { outputAmount, totalFees, feePct } = calculateOutputAfterFees({
    inputAmount: exactInputAmount,
    relayerFeeDetails,
    inputToken,
    outputToken,
  });

  // 5. Calculate estimated fill time
  const estimatedFillTimeSec = calculateEstimatedFillTime({
    inputToken,
    inputAmount: exactInputAmount,
    inputTokenPriceUsd,
    hyperEvmChainId,
  });

  // 6. Build suggestedFees structure
  const suggestedFees = buildSuggestedFeesForUsdh({
    relayerFeeDetails,
    outputAmount,
    estimatedFillTimeSec,
  });

  return {
    inputToken: inputToken,
    outputToken: outputToken,
    inputAmount: exactInputAmount,
    outputAmount,
    minOutputAmount: outputAmount,
    estimatedFillTimeSec,
    fees: {
      amount: totalFees,
      pct: feePct,
      token: inputToken,
    },
    message: depositMessage,
    suggestedFees,
  };
}

export async function getUsdhUnsponsoredQuoteForOutput({
  inputToken,
  outputToken,
  minOutputAmount,
  recipient,
  forceExactOutput,
}: GetOutputBridgeQuoteParams) {
  assertSupportedRoute({ inputToken, outputToken });

  const hyperEvmChainId = getHyperEvmChainId(outputToken.chainId);
  const bridgeableOutputToken = getBridgeableOutputToken(outputToken);

  // 1. Get token prices
  const [outputTokenPriceNative, inputTokenPriceUsd] = await Promise.all([
    getCachedTokenPrice({
      symbol: bridgeableOutputToken.symbol,
      baseCurrency: sdk.utils
        .getNativeTokenSymbol(hyperEvmChainId)
        .toLowerCase(),
    }),
    getCachedTokenPrice({
      symbol: inputToken.symbol,
      baseCurrency: "usd",
    }),
  ]);

  const depositRecipient = getDepositRecipient({ outputToken, recipient });
  const depositMessage = getDepositMessage({ outputToken, recipient });

  // 2. Start with minOutputAmount and iteratively find required input
  const maxTries = 3;
  const tryChunkSize = 3;
  let tries = 0;

  // Initial estimate: add 2% buffer for fees
  let estimatedInput = ConvertDecimals(
    outputToken.decimals,
    inputToken.decimals
  )(minOutputAmount)
    .mul(102)
    .div(100);

  let finalQuote:
    | {
        inputAmount: BigNumber;
        outputAmount: BigNumber;
        fees: { amount: BigNumber; pct: BigNumber; token: Token };
        relayerFeeDetails: Awaited<
          ReturnType<typeof getRelayerFeeDetailsOnHyperEvm>
        >;
      }
    | undefined;

  // 3. Iterate to find correct input amount
  while (tries < maxTries && !finalQuote) {
    const inputAmounts = Array.from({ length: tryChunkSize }).map((_, i) => {
      const buffer = 0.005 * i; // 0%, 0.5%, 1% buffers
      return estimatedInput.mul(Math.floor((1 + buffer) * 1000)).div(1000);
    });

    const quotes = await Promise.allSettled(
      inputAmounts.map(async (inputAmount) => {
        const relayerFeeDetails = await getRelayerFeeDetailsOnHyperEvm({
          inputToken,
          outputToken,
          amount: inputAmount,
          recipient: depositRecipient,
          message: depositMessage,
          outputTokenPriceNative,
        });

        const { outputAmount, totalFees, feePct } = calculateOutputAfterFees({
          inputAmount,
          relayerFeeDetails,
          inputToken,
          outputToken,
        });

        return {
          inputAmount,
          outputAmount,
          fees: {
            amount: totalFees,
            pct: feePct,
            token: inputToken,
          },
          relayerFeeDetails,
        };
      })
    );

    // Find first successful quote that meets minOutputAmount
    for (const result of quotes) {
      if (result.status === "fulfilled") {
        const quote = result.value;
        if (quote.outputAmount.gte(minOutputAmount)) {
          finalQuote = quote;
          break;
        }
      }
    }

    // If no quote found, increase estimate
    estimatedInput = inputAmounts[inputAmounts.length - 1].mul(102).div(100);
    tries++;
  }

  if (!finalQuote) {
    throw new Error(
      `${ERROR_MESSAGE_PREFIX}: Failed to adjust input amount to meet minOutputAmount`
    );
  }

  // 4. Check balance on HyperEVM
  await assertSufficientBalanceOnHyperEvm({
    amountHyperEvm: ConvertDecimals(
      inputToken.decimals,
      bridgeableOutputToken.decimals
    )(finalQuote.inputAmount),
    inputToken,
    outputToken,
  });

  // 5. Calculate estimated fill time
  const estimatedFillTimeSec = calculateEstimatedFillTime({
    inputToken,
    inputAmount: finalQuote.inputAmount,
    inputTokenPriceUsd,
    hyperEvmChainId,
  });

  // 6. Apply forceExactOutput logic if needed
  let adjustedOutputAmount = finalQuote.outputAmount;
  let adjustedFees = finalQuote.fees;
  let adjustedRelayerFeeDetails = finalQuote.relayerFeeDetails;

  if (forceExactOutput) {
    // Calculate the excess output beyond the requested minOutputAmount
    const excessOutput = finalQuote.outputAmount.sub(minOutputAmount);

    if (excessOutput.gt(0)) {
      // Convert excess output back to input token decimals
      const excessInput = ConvertDecimals(
        outputToken.decimals,
        inputToken.decimals
      )(excessOutput);

      // Adjust fees by adding the excess to capital fee
      const adjustedCapitalFeeTotal = BigNumber.from(
        finalQuote.relayerFeeDetails.capitalFeeTotal
      ).add(excessInput);
      const adjustedTotalRelayFeeTotal = BigNumber.from(
        finalQuote.relayerFeeDetails.relayFeeTotal
      ).add(excessInput);

      // Calculate new percentages based on adjusted totals
      const adjustedCapitalFeePct = adjustedCapitalFeeTotal
        .mul(utils.parseEther("1"))
        .div(finalQuote.inputAmount);
      const adjustedTotalRelayFeePct = adjustedTotalRelayFeeTotal
        .mul(utils.parseEther("1"))
        .div(finalQuote.inputAmount);

      // Update fee details
      adjustedRelayerFeeDetails = {
        ...finalQuote.relayerFeeDetails,
        capitalFeeTotal: adjustedCapitalFeeTotal.toString(),
        capitalFeePercent: adjustedCapitalFeePct.toString(),
        relayFeeTotal: adjustedTotalRelayFeeTotal.toString(),
        relayFeePercent: adjustedTotalRelayFeePct.toString(),
      };

      adjustedFees = {
        amount: adjustedTotalRelayFeeTotal,
        pct: adjustedTotalRelayFeePct,
        token: inputToken,
      };

      // Force output to exactly match minOutputAmount
      adjustedOutputAmount = minOutputAmount;
    }
  }

  // 7. Build suggestedFees structure
  const suggestedFees = buildSuggestedFeesForUsdh({
    relayerFeeDetails: adjustedRelayerFeeDetails,
    outputAmount: adjustedOutputAmount,
    estimatedFillTimeSec,
  });

  return {
    inputToken: inputToken,
    outputToken: outputToken,
    inputAmount: finalQuote.inputAmount,
    outputAmount: adjustedOutputAmount,
    minOutputAmount,
    estimatedFillTimeSec,
    fees: adjustedFees,
    message: depositMessage,
    suggestedFees,
  };
}
