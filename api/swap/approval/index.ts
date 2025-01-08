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
  buildBaseSwapResponseJson,
  calculateCrossSwapFees,
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
      refundToken,
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

    const [crossSwapTx, fees] = await Promise.all([
      buildCrossSwapTxForAllowanceHolder(crossSwapQuotes, integratorId),
      calculateCrossSwapFees(crossSwapQuotes),
    ]);

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

    const responseJson = buildBaseSwapResponseJson({
      originChainId,
      inputTokenAddress,
      inputAmount,
      fees,
      approvalSwapTx: {
        ...crossSwapTx,
        gas: originTxGas,
        gasPrice: originTxGasPrice,
      },
      allowance,
      balance,
      approvalTxns,
      originSwapQuote,
      bridgeQuote,
      destinationSwapQuote,
      refundToken,
    });
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
