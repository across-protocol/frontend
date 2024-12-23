import { VercelResponse } from "@vercel/node";
import { BigNumber, constants } from "ethers";

import { TypedVercelRequest } from "../../_types";
import {
  getLogger,
  getProvider,
  handleErrorCondition,
  latestGasPriceCache,
  Profiler,
} from "../../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "./_utils";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  getApprovalTxns,
} from "../_utils";
import { getBalanceAndAllowance } from "../../_erc20";
import { getCrossSwapQuotes } from "../../_dexes/cross-swap-service";
import { getSwapRouter02Strategy } from "../../_dexes/uniswap/swap-router-02";
import { QuoteFetchStrategies } from "../../_dexes/utils";

// For approval-based flows, we use the `UniversalSwapAndBridge` strategy with Uniswap V3's `SwapRouter02`
const quoteFetchStrategies: QuoteFetchStrategies = {
  default: getSwapRouter02Strategy("UniversalSwapAndBridge"),
};

const handler = async (
  request: TypedVercelRequest<BaseSwapQueryParams>,
  response: VercelResponse
) => {
  const logger = getLogger();
  logger.debug({
    at: "Swap/approval",
    message: "Query data",
    query: request.query,
  });
  try {
    const profiler = new Profiler({
      at: "swap/approval",
      logger: console,
    });
    const mark = profiler.start("e2e endpoint runtime");

    const {
      integratorId,
      skipOriginTxEstimation,
      isInputNative,
      isOutputNative,
      inputToken,
      outputToken,
      amount,
      amountType,
      refundOnOrigin,
      refundAddress,
      recipient,
      depositor,
      slippageTolerance,
    } = await handleBaseSwapQueryParams(request.query);

    const crossSwapQuotes = await getCrossSwapQuotes(
      {
        amount,
        inputToken,
        outputToken,
        depositor,
        recipient: recipient || depositor,
        slippageTolerance: Number(slippageTolerance),
        type: amountType,
        refundOnOrigin,
        refundAddress,
        isInputNative,
        isOutputNative,
      },
      quoteFetchStrategies
    );

    const crossSwapTx = await buildCrossSwapTxForAllowanceHolder(
      crossSwapQuotes,
      integratorId
    );

    const { originSwapQuote, bridgeQuote, destinationSwapQuote, crossSwap } =
      crossSwapQuotes;

    const originChainId = crossSwap.inputToken.chainId;
    const inputTokenAddress = isInputNative
      ? constants.AddressZero
      : crossSwap.inputToken.address;
    const inputAmount =
      originSwapQuote?.maximumAmountIn || bridgeQuote.inputAmount;

    const { allowance, balance } = await getBalanceAndAllowance({
      chainId: originChainId,
      tokenAddress: inputTokenAddress,
      owner: crossSwap.depositor,
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
          from: crossSwap.depositor,
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
        token: crossSwap.inputToken,
        spender: crossSwapTx.to,
        amount: approvalAmount,
      });
    }

    const refundToken = crossSwap.refundOnOrigin
      ? bridgeQuote.inputToken
      : bridgeQuote.outputToken;

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
      steps: {
        originSwap: originSwapQuote
          ? {
              tokenIn: originSwapQuote.tokenIn,
              tokenOut: originSwapQuote.tokenOut,
              inputAmount: originSwapQuote.expectedAmountIn.toString(),
              outputAmount: originSwapQuote.expectedAmountOut.toString(),
              minOutputAmount: originSwapQuote.minAmountOut.toString(),
              maxInputAmount: originSwapQuote.maximumAmountIn.toString(),
            }
          : undefined,
        bridge: {
          inputAmount: bridgeQuote.inputAmount.toString(),
          outputAmount: bridgeQuote.outputAmount.toString(),
          tokenIn: bridgeQuote.inputToken,
          tokenOut: bridgeQuote.outputToken,
        },
        destinationSwap: destinationSwapQuote
          ? {
              tokenIn: destinationSwapQuote.tokenIn,
              tokenOut: destinationSwapQuote.tokenOut,
              inputAmount: destinationSwapQuote.expectedAmountIn.toString(),
              maxInputAmount: destinationSwapQuote.maximumAmountIn.toString(),
              outputAmount: destinationSwapQuote.expectedAmountOut.toString(),
              minOutputAmount: destinationSwapQuote.minAmountOut.toString(),
            }
          : undefined,
      },
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
        originSwapQuote?.expectedAmountIn.toString() ??
        bridgeQuote.inputAmount.toString(),
      expectedOutputAmount:
        destinationSwapQuote?.expectedAmountOut.toString() ??
        bridgeQuote.outputAmount.toString(),
      minOutputAmount:
        destinationSwapQuote?.minAmountOut.toString() ??
        bridgeQuote.outputAmount.toString(),
      expectedFillTime: bridgeQuote.suggestedFees.estimatedFillTimeSec,
    };
    mark.stop();
    logger.debug({
      at: "Swap/approval",
      message: "Response data",
      responseJson,
    });
    response.status(200).json(responseJson);
  } catch (error: unknown) {
    return handleErrorCondition("swap/approval", response, logger, error);
  }
};

export default handler;