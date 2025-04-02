import { BigNumber } from "ethers";

import { getTokenByAddress } from "utils/constants";
import {
  SwapApprovalApiReturnType,
  SwapApprovalApiQueryParams,
} from "../prod/swap-approval";

export async function swapApprovalApiCall(
  params: SwapApprovalApiQueryParams
): Promise<SwapApprovalApiReturnType> {
  const inputToken = getTokenByAddress(params.inputToken);
  const outputToken = getTokenByAddress(params.outputToken);

  return {
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
        tokenIn: {
          address: params.inputToken,
          chainId: params.originChainId,
          decimals: inputToken.decimals,
          symbol: inputToken.symbol,
        },
        tokenOut: {
          address: params.outputToken,
          chainId: params.destinationChainId,
          decimals: outputToken.decimals,
          symbol: outputToken.symbol,
        },
        fees: {
          totalRelay: {
            pct: BigNumber.from("0"),
            total: BigNumber.from("0"),
          },
          relayerCapital: {
            pct: BigNumber.from("0"),
            total: BigNumber.from("0"),
          },
          relayerGas: {
            pct: BigNumber.from("0"),
            total: BigNumber.from("0"),
          },
          lp: {
            pct: BigNumber.from("0"),
            total: BigNumber.from("0"),
          },
        },
      },
      destinationSwap: undefined,
    },
    refundToken: {
      address: params.inputToken,
      chainId: params.originChainId,
      decimals: 18,
      symbol: params.inputToken,
    },
    inputAmount: BigNumber.from(params.amount),
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
  };
}
