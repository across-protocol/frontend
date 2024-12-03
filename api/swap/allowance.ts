import { VercelResponse } from "@vercel/node";
import { BigNumber, constants } from "ethers";

import { TypedVercelRequest } from "../_types";
import {
  getLogger,
  getProvider,
  handleErrorCondition,
  latestGasPriceCache,
} from "../_utils";
import {
  AMOUNT_TYPE,
  buildCrossSwapTxForAllowanceHolder,
} from "../_dexes/cross-swap";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  getApprovalTxns,
} from "./_utils";
import { getBalanceAndAllowance } from "../_erc20";

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/allowance",
    message: "Query data",
    query: request.query,
  });
  try {
    const {
      crossSwapQuotes,
      integratorId,
      skipOriginTxEstimation,
      isInputNative,
    } = await handleBaseSwapQueryParams(request);

    const crossSwapTx = await buildCrossSwapTxForAllowanceHolder(
      crossSwapQuotes,
      integratorId
    );

    const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
    const inputTokenAddress = isInputNative
      ? constants.AddressZero
      : crossSwapQuotes.crossSwap.inputToken.address;
    const inputAmount =
      crossSwapQuotes.originSwapQuote?.maximumAmountIn ||
      crossSwapQuotes.bridgeQuote.inputAmount;

    const { allowance, balance } = await getBalanceAndAllowance({
      chainId: originChainId,
      tokenAddress: inputTokenAddress,
      owner: crossSwapQuotes.crossSwap.depositor,
      spender: crossSwapTx.to,
    });

    const isSwapTxEstimationPossible =
      !skipOriginTxEstimation &&
      allowance.gte(inputAmount) &&
      balance.gte(inputAmount);

    let originTxGas: BigNumber | undefined;
    let originTxGasPrice: BigNumber | undefined;
    if (isSwapTxEstimationPossible) {
      const provider = getProvider(originChainId);
      [originTxGas, originTxGasPrice] = await Promise.all([
        provider.estimateGas({
          ...crossSwapTx,
          from: crossSwapQuotes.crossSwap.depositor,
        }),
        latestGasPriceCache(originChainId).get(),
      ]);
    } else {
      originTxGasPrice = await latestGasPriceCache(originChainId).get();
    }

    let approvalTxns:
      | {
          chainId: number;
          to: string;
          data: string;
        }[]
      | undefined;
    // @TODO: Allow for just enough approval amount to be set.
    const approvalAmount = constants.MaxUint256;
    if (allowance.lt(inputAmount)) {
      approvalTxns = getApprovalTxns({
        token: crossSwapQuotes.crossSwap.inputToken,
        spender: crossSwapTx.to,
        amount: approvalAmount,
      });
    }

    const refundToken = crossSwapQuotes.crossSwap.refundOnOrigin
      ? crossSwapQuotes.bridgeQuote.inputToken
      : crossSwapQuotes.bridgeQuote.outputToken;

    const responseJson = {
      // fees: crossSwapQuotes.fees,
      checks: {
        allowance: {
          token: inputTokenAddress,
          spender: crossSwapTx.to,
          actual: allowance.toString(),
          expected: inputAmount.toString(),
        },
        balance: {
          token: inputTokenAddress,
          actual: balance.toString(),
          expected: inputAmount.toString(),
        },
      },
      approvalTxns,
      swapTx: {
        simulationSuccess: !!originTxGas,
        chainId: originChainId,
        to: crossSwapTx.to,
        data: crossSwapTx.data,
        value: crossSwapTx.value?.toString(),
        gas: originTxGas?.toString(),
        gasPrice: originTxGasPrice?.toString(),
      },
      refundToken:
        refundToken.symbol === "ETH"
          ? {
              ...refundToken,
              symbol: "WETH",
            }
          : refundToken,
      inputAmount:
        crossSwapQuotes.originSwapQuote?.expectedAmountIn.toString() ??
        crossSwapQuotes.bridgeQuote.inputAmount.toString(),
      expectedOutputAmount:
        crossSwapQuotes.destinationSwapQuote?.expectedAmountOut.toString() ??
        crossSwapQuotes.bridgeQuote.outputAmount.toString(),
      minOutputAmount:
        crossSwapQuotes.destinationSwapQuote?.minAmountOut.toString() ??
        crossSwapQuotes.bridgeQuote.outputAmount.toString(),
      expectedFillTime:
        crossSwapQuotes.bridgeQuote.suggestedFees.estimatedFillTimeSec,
    };

    logger.debug({
      at: "Swap/allowance",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/allowance", response, logger, error);
  }
};

export default handler;
