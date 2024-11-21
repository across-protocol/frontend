import { VercelResponse } from "@vercel/node";

import { TypedVercelRequest } from "../_types";
import {
  getLogger,
  getProvider,
  handleErrorCondition,
  latestGasPriceCache,
} from "../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "../_dexes/cross-swap";
import { handleBaseSwapQueryParams, BaseSwapQueryParams } from "./_utils";
import { BigNumber } from "ethers";
import { getAllowance, getBalance } from "../_erc20";
import { encodeApproveCalldata } from "../_multicall-handler";

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
    const { crossSwapQuotes, integratorId, skipOriginTxEstimation } =
      await handleBaseSwapQueryParams(request);

    const crossSwapTx = await buildCrossSwapTxForAllowanceHolder(
      crossSwapQuotes,
      integratorId
    );

    const originChainId = crossSwapQuotes.crossSwap.inputToken.chainId;
    const inputTokenAddress = crossSwapQuotes.crossSwap.inputToken.address;
    const inputAmount =
      crossSwapQuotes.originSwapQuote?.maximumAmountIn ||
      crossSwapQuotes.bridgeQuote.inputAmount;

    const [allowance, balance] = await Promise.all([
      getAllowance({
        chainId: originChainId,
        tokenAddress: inputTokenAddress,
        owner: crossSwapQuotes.crossSwap.depositor,
        spender: crossSwapTx.to,
      }),
      getBalance({
        chainId: originChainId,
        tokenAddress: inputTokenAddress,
        owner: crossSwapQuotes.crossSwap.depositor,
      }),
    ]);

    let allowanceTx:
      | {
          chainId: number;
          from: string;
          to: string;
          data: string;
          value?: string;
        }
      | undefined;
    if (allowance.lt(inputAmount)) {
      allowanceTx = {
        to: crossSwapQuotes.crossSwap.inputToken.address,
        chainId: originChainId,
        from: crossSwapQuotes.crossSwap.depositor,
        data: encodeApproveCalldata(crossSwapTx.to, inputAmount),
      };
    }

    const isSwapTxEstimationPossible =
      !skipOriginTxEstimation && !allowanceTx && balance.gte(inputAmount);

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

    const responseJson = {
      checks: {
        allowance: {
          token: inputTokenAddress,
          spender: crossSwapTx.to,
          actual: allowance.toString(),
          expected: inputAmount.toString(),
          tx: allowanceTx,
        },
        balance: {
          token: inputTokenAddress,
          actual: balance.toString(),
          expected: inputAmount.toString(),
        },
      },
      tx: {
        chainId: originChainId,
        to: crossSwapTx.to,
        data: crossSwapTx.data,
        value: crossSwapTx.value?.toString(),
        gas: originTxGas?.toString(),
        gasPrice: originTxGasPrice?.toString(),
      },
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
