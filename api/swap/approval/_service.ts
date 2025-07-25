import { BigNumber, constants, ethers } from "ethers";

import {
  getCachedTokenPrice,
  getProvider,
  InputError,
  latestGasPriceCache,
} from "../../_utils";
import { buildCrossSwapTxForAllowanceHolder } from "./_utils";
import {
  handleBaseSwapQueryParams,
  BaseSwapQueryParams,
  getApprovalTxns,
  buildBaseSwapResponseJson,
  handleSwapBody,
  SwapBody,
} from "../_utils";
import { getBalanceAndAllowance } from "../../_erc20";
import { getCrossSwapQuotes } from "../../_dexes/cross-swap-service";
import { QuoteFetchStrategies } from "../../_dexes/utils";
import { TypedVercelRequest } from "../../_types";
import { getSwapRouter02Strategy } from "../../_dexes/uniswap/swap-router-02";
import { CHAIN_IDs } from "../../_constants";
import { getWrappedGhoStrategy } from "../../_dexes/gho/wrapped-gho";
import { getWghoMulticallStrategy } from "../../_dexes/gho/multicall";
import { AcrossErrorCode } from "../../_errors";

// For approval-based flows, we use the `UniversalSwapAndBridge` strategy with Uniswap V3's `SwapRouter02`
const quoteFetchStrategies: QuoteFetchStrategies = {
  default: [getSwapRouter02Strategy("UniversalSwapAndBridge", "trading-api")],
  chains: {
    [CHAIN_IDs.LENS]: [
      getSwapRouter02Strategy("UniversalSwapAndBridge", "sdk-swap-quoter"),
    ],
  },
  swapPairs: {
    [CHAIN_IDs.MAINNET]: {
      GHO: {
        WGHO: [getWrappedGhoStrategy()],
      },
      WGHO: {
        GHO: [getWrappedGhoStrategy()],
        USDC: [getWrappedGhoStrategy()],
        USDT: [getWrappedGhoStrategy()],
        DAI: [getWrappedGhoStrategy()],
      },
      USDC: {
        WGHO: [getWghoMulticallStrategy()],
      },
      USDT: {
        WGHO: [getWghoMulticallStrategy()],
      },
      DAI: {
        WGHO: [getWghoMulticallStrategy()],
      },
    },
  },
};

export async function handleApprovalSwap(
  request: TypedVercelRequest<BaseSwapQueryParams, SwapBody>
) {
  // This handler supports both GET and POST requests.
  // For GET requests, we expect the body to be empty.
  // TODO: Allow only POST requests
  if (request.method !== "POST" && request.body) {
    throw new InputError({
      message: "POST method required when request.body is provided",
      code: AcrossErrorCode.INVALID_METHOD,
    });
  }

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
    excludeSources,
    includeSources,
    appFeePercent,
    appFeeRecipient,
  } = await handleBaseSwapQueryParams(request.query);

  const { actions } = request.body
    ? handleSwapBody(request.body)
    : { actions: [] };

  const crossSwapQuotes = await getCrossSwapQuotes(
    {
      amount,
      inputToken,
      outputToken,
      depositor,
      recipient: recipient || depositor,
      slippageTolerance,
      type: amountType,
      refundOnOrigin,
      refundAddress,
      isInputNative,
      isOutputNative,
      embeddedActions: actions,
      excludeSources,
      includeSources,
      appFeePercent,
      appFeeRecipient,
    },
    quoteFetchStrategies
  );

  const crossSwapTx = await buildCrossSwapTxForAllowanceHolder(
    crossSwapQuotes,
    integratorId
  );

  const {
    originSwapQuote,
    bridgeQuote,
    destinationSwapQuote,
    crossSwap,
    appFee,
  } = crossSwapQuotes;

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
  let originTxGasPrice:
    | {
        maxFeePerGas: BigNumber;
        maxPriorityFeePerGas: BigNumber;
      }
    | undefined;
  let inputTokenPriceUsd: number;
  let outputTokenPriceUsd: number;
  let originNativePriceUsd: number;
  let destinationNativePriceUsd: number;
  if (isSwapTxEstimationPossible) {
    const provider = getProvider(originChainId);
    [
      originTxGas,
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
    ] = await Promise.all([
      provider.estimateGas({
        ...crossSwapTx,
        from: crossSwap.depositor,
      }),
      latestGasPriceCache(originChainId).get(),
      getCachedTokenPrice(
        inputToken.address,
        "usd",
        undefined,
        inputToken.chainId
      ),
      getCachedTokenPrice(
        outputToken.address,
        "usd",
        undefined,
        outputToken.chainId
      ),
      getCachedTokenPrice(
        ethers.constants.AddressZero,
        "usd",
        undefined,
        inputToken.chainId
      ),
      getCachedTokenPrice(
        ethers.constants.AddressZero,
        "usd",
        undefined,
        outputToken.chainId
      ),
    ]);
  } else {
    [
      originTxGasPrice,
      inputTokenPriceUsd,
      outputTokenPriceUsd,
      originNativePriceUsd,
      destinationNativePriceUsd,
    ] = await Promise.all([
      latestGasPriceCache(originChainId).get(),
      getCachedTokenPrice(
        inputToken.address,
        "usd",
        undefined,
        inputToken.chainId
      ),
      getCachedTokenPrice(
        outputToken.address,
        "usd",
        undefined,
        outputToken.chainId
      ),
      getCachedTokenPrice(
        ethers.constants.AddressZero,
        "usd",
        undefined,
        inputToken.chainId
      ),
      getCachedTokenPrice(
        ethers.constants.AddressZero,
        "usd",
        undefined,
        outputToken.chainId
      ),
    ]);
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
      allowance,
      token: crossSwap.inputToken,
      spender: crossSwapTx.to,
      amount: approvalAmount,
    });
  }

  const responseJson = await buildBaseSwapResponseJson({
    amountType,
    originChainId,
    inputTokenAddress,
    inputAmount,
    approvalSwapTx: {
      ...crossSwapTx,
      gas: originTxGas,
      maxFeePerGas: originTxGasPrice?.maxFeePerGas,
      maxPriorityFeePerGas: originTxGasPrice?.maxPriorityFeePerGas,
    },
    allowance,
    balance,
    approvalTxns,
    originSwapQuote,
    bridgeQuote,
    destinationSwapQuote,
    refundToken,
    appFeePercent,
    appFee,
    inputTokenPriceUsd,
    outputTokenPriceUsd,
    originNativePriceUsd,
    destinationNativePriceUsd,
  });
  return responseJson;
}
