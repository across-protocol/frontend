import { BigNumber, utils } from "ethers";
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
import { GetExactInputBridgeQuoteParams } from "../../types";
import {
  ERROR_MESSAGE_PREFIX,
  USDH_FILL_DESTINATION_GAS_LIMIT_USD,
} from "./constants";
import { InvalidParamError } from "../../../_errors";
import { resolveTiming } from "../../../_timings";

/**
 * Calculate estimated fill time for a bridge to HyperEVM.
 */
export async function getEstimatedFillTimeToHyperEvm(params: {
  inputToken: Token;
  outputToken: Token;
  inputAmount: BigNumber;
}): Promise<number> {
  const hyperEvmChainId = getHyperEvmChainId(params.outputToken.chainId);

  const inputTokenPriceUsd = await getCachedTokenPrice({
    symbol: params.inputToken.symbol,
    baseCurrency: "usd",
  });

  const inputAmountUsd = params.inputAmount
    .mul(utils.parseUnits(inputTokenPriceUsd.toString()))
    .div(utils.parseUnits("1", params.inputToken.decimals));

  return resolveTiming(
    String(params.inputToken.chainId),
    String(hyperEvmChainId),
    params.inputToken.symbol,
    inputAmountUsd
  );
}

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

  const [outputTokenPriceNative, inputTokenPriceUsd, estimatedFillTimeSec] =
    await Promise.all([
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
      getEstimatedFillTimeToHyperEvm({
        inputToken,
        outputToken,
        inputAmount: exactInputAmount,
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

  return {
    inputToken,
    outputToken,
    inputAmount: exactInputAmount,
    outputAmount,
    minOutputAmount: outputAmount,
    estimatedFillTimeSec,
    fees: getZeroBridgeFees(inputToken),
    message: depositMessage,
  };
}
