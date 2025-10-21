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
          decimals: inputToken?.decimals ?? 18,
          symbol: inputToken?.symbol ?? "UNKNOWN",
        },
        tokenOut: {
          address: params.outputToken,
          chainId: params.destinationChainId,
          decimals: outputToken?.decimals ?? 18,
          symbol: outputToken?.symbol ?? "UNKNOWN",
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
    fees: {
      total: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: "0",
        token: {
          decimals: outputToken?.decimals ?? 18,
          symbol: outputToken?.symbol ?? "UNKNOWN",
          address: params.outputToken,
          name: outputToken?.symbol ?? "UNKNOWN",
          chainId: params.destinationChainId,
        },
      },
      originGas: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        token: {
          chainId: params.originChainId,
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          symbol: "ETH",
        },
      },
      destinationGas: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: "0",
        token: {
          chainId: params.destinationChainId,
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          symbol: "ETH",
        },
      },
      relayerCapital: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: "0",
        token: {
          decimals: outputToken?.decimals ?? 18,
          symbol: outputToken?.symbol ?? "UNKNOWN",
          address: params.outputToken,
          name: outputToken?.symbol ?? "UNKNOWN",
          chainId: params.destinationChainId,
        },
      },
      lpFee: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: "0",
        token: {
          decimals: outputToken?.decimals ?? 18,
          symbol: outputToken?.symbol ?? "UNKNOWN",
          address: params.outputToken,
          name: outputToken?.symbol ?? "UNKNOWN",
          chainId: params.destinationChainId,
        },
      },
      relayerTotal: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: "0",
        token: {
          decimals: outputToken?.decimals ?? 18,
          symbol: outputToken?.symbol ?? "UNKNOWN",
          address: params.outputToken,
          name: outputToken?.symbol ?? "UNKNOWN",
          chainId: params.destinationChainId,
        },
      },
      app: {
        amount: BigNumber.from("0"),
        amountUsd: "0",
        pct: "0",
        token: {
          decimals: outputToken?.decimals ?? 18,
          symbol: outputToken?.symbol ?? "UNKNOWN",
          address: params.outputToken,
          name: outputToken?.symbol ?? "UNKNOWN",
          chainId: params.destinationChainId,
        },
      },
      swap: undefined,
    },
  };
}
