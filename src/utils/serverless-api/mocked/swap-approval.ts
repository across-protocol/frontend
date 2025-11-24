import { BigNumber } from "ethers";

import {
  SwapApprovalApiReturnType,
  SwapApprovalApiQueryParams,
} from "../prod/swap-approval";
import { getConfig } from "utils/config";

const config = getConfig();

export async function swapApprovalApiCall(
  params: SwapApprovalApiQueryParams
): Promise<SwapApprovalApiReturnType> {
  const inputToken = config.getTokenInfoByAddressSafe(
    params.originChainId,
    params.inputToken
  );
  const outputToken = config.getTokenInfoByAddressSafe(
    params.destinationChainId,
    params.outputToken
  );

  const inputTokenInfo = {
    address: params.inputToken,
    chainId: params.originChainId,
    decimals: inputToken?.decimals ?? 18,
    symbol: inputToken?.symbol ?? "UNKNOWN",
  };

  const outputTokenInfo = {
    address: params.outputToken,
    chainId: params.destinationChainId,
    decimals: outputToken?.decimals ?? 18,
    symbol: outputToken?.symbol ?? "UNKNOWN",
  };

  const nativeTokenInfo = {
    chainId: params.originChainId,
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    symbol: "ETH",
  };

  return {
    crossSwapType: "BRIDGEABLE_TO_BRIDGEABLE",
    amountType: params.tradeType || "exactInput",
    checks: {
      allowance: {
        token: params.inputToken,
        spender: params.recipient,
        actual: BigNumber.from("0"),
        expected: BigNumber.from("0"),
      },
      balance: {
        token: params.inputToken,
        actual: BigNumber.from("0"),
        expected: BigNumber.from("0"),
      },
    },
    approvalTxns: [],
    steps: {
      originSwap: undefined,
      bridge: {
        inputAmount: BigNumber.from("0"),
        outputAmount: BigNumber.from("0"),
        tokenIn: inputTokenInfo,
        tokenOut: outputTokenInfo,
        fees: {
          amount: BigNumber.from("0"),
          pct: BigNumber.from("0"),
          token: inputTokenInfo,
          details: {
            type: "across",
            lp: {
              amount: BigNumber.from("0"),
              pct: BigNumber.from("0"),
            },
            relayerCapital: {
              amount: BigNumber.from("0"),
              pct: BigNumber.from("0"),
            },
            destinationGas: {
              amount: BigNumber.from("0"),
              pct: BigNumber.from("0"),
            },
          },
        },
        provider: "across",
      },
      destinationSwap: undefined,
    },
    inputToken: inputTokenInfo,
    outputToken: outputTokenInfo,
    refundToken: {
      address: params.inputToken,
      chainId: params.originChainId,
      decimals: 18,
      symbol: params.inputToken,
    },
    inputAmount: BigNumber.from(params.amount),
    maxInputAmount: BigNumber.from(params.amount),
    expectedOutputAmount: BigNumber.from(params.amount),
    minOutputAmount: BigNumber.from(params.amount),
    expectedFillTime: 1,
    swapTx: {
      simulationSuccess: true,
      chainId: params.originChainId,
      to: "0x",
      data: "0x",
      value: BigNumber.from("0"),
      gas: BigNumber.from("0"),
      maxFeePerGas: BigNumber.from("0"),
      maxPriorityFeePerGas: BigNumber.from("0"),
    },
    fees: {
      total: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: BigNumber.from("0"),
        token: outputTokenInfo,
        details: {
          type: "TOTAL_BREAKDOWN",
          swapImpact: {
            amount: BigNumber.from("0"),
            amountUsd: "0",
            pct: BigNumber.from("0"),
            token: inputTokenInfo,
          },
          app: {
            amount: BigNumber.from("0"),
            amountUsd: "0",
            pct: BigNumber.from("0"),
            token: outputTokenInfo,
          },
          bridge: {
            amount: BigNumber.from("0"),
            amountUsd: "0",
            pct: BigNumber.from("0"),
            token: inputTokenInfo,
            details: {
              type: "across",
              lp: {
                amount: BigNumber.from("0"),
                amountUsd: "0",
                pct: BigNumber.from("0"),
                token: inputTokenInfo,
              },
              relayerCapital: {
                amount: BigNumber.from("0"),
                amountUsd: "0",
                pct: BigNumber.from("0"),
                token: inputTokenInfo,
              },
              destinationGas: {
                amount: BigNumber.from("0"),
                amountUsd: "0",
                pct: BigNumber.from("0"),
                token: nativeTokenInfo,
              },
            },
          },
        },
      },
      totalMax: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: BigNumber.from("0"),
        token: outputTokenInfo,
        details: {
          type: "MAX_TOTAL_BREAKDOWN",
          maxSwapImpact: {
            amount: BigNumber.from("0"),
            amountUsd: "0",
            pct: BigNumber.from("0"),
            token: inputTokenInfo,
          },
          app: {
            amount: BigNumber.from("0"),
            amountUsd: "0",
            pct: BigNumber.from("0"),
            token: outputTokenInfo,
          },
          bridge: {
            amount: BigNumber.from("0"),
            amountUsd: "0",
            pct: BigNumber.from("0"),
            token: inputTokenInfo,
            details: {
              type: "across",
              lp: {
                amount: BigNumber.from("0"),
                amountUsd: "0",
                pct: BigNumber.from("0"),
                token: inputTokenInfo,
              },
              relayerCapital: {
                amount: BigNumber.from("0"),
                amountUsd: "0",
                pct: BigNumber.from("0"),
                token: inputTokenInfo,
              },
              destinationGas: {
                amount: BigNumber.from("0"),
                amountUsd: "0",
                pct: BigNumber.from("0"),
                token: nativeTokenInfo,
              },
            },
          },
        },
      },
      originGas: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        token: nativeTokenInfo,
        pct: BigNumber.from("0"),
      },
    },
    eip712: undefined,
  };
}
