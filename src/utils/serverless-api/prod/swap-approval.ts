import axios from "axios";
import { BigNumber } from "ethers";
import { vercelApiBaseUrl } from "utils";

export type SwapApprovalApiCall = typeof swapApprovalApiCall;

export type SwapApiToken = {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
};

export type SwapApprovalApiReturnType = Awaited<
  ReturnType<typeof swapApprovalApiCall>
>;

export type SwapApprovalApiResponse = {
  checks: {
    allowance: {
      token: string;
      spender: string;
      actual: string;
      expected: string;
    };
    balance: {
      token: string;
      actual: string;
      expected: string;
    };
  };
  approvalTxns: {
    chainId: number;
    to: string;
    data: string;
  }[];
  steps: {
    originSwap?: {
      tokenIn: SwapApiToken;
      tokenOut: SwapApiToken;
      inputAmount: string;
      outputAmount: string;
      minOutputAmount: string;
      maxInputAmount: string;
      swapProvider: {
        name: string;
        sources: string[];
      };
    };
    bridge: {
      inputAmount: string;
      outputAmount: string;
      tokenIn: SwapApiToken;
      tokenOut: SwapApiToken;
      fees: {
        totalRelay: {
          pct: string;
          total: string;
        };
        relayerCapital: {
          pct: string;
          total: string;
        };
        relayerGas: {
          pct: string;
          total: string;
        };
        lp: {
          pct: string;
          total: string;
        };
      };
    };
    destinationSwap?: {
      tokenIn: SwapApiToken;
      tokenOut: SwapApiToken;
      inputAmount: string;
      maxInputAmount: string;
      outputAmount: string;
      minOutputAmount: string;
      swapProvider: {
        name: string;
        sources: string[];
      };
    };
  };
  refundToken: SwapApiToken;
  inputAmount: string;
  expectedOutputAmount: string;
  minOutputAmount: string;
  expectedFillTime: number;
  swapTx: {
    simulationSuccess: boolean;
    chainId: number;
    to: string;
    data: string;
    value?: string;
    gas?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  fees: {
    total: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        decimals: number;
        symbol: string;
        address: string;
        name: string;
        chainId: number;
      };
    };
    originGas: {
      amount: string;
      amountUsd: string;
      token: {
        chainId: number;
        address: string;
        decimals: number;
        symbol: string;
      };
    };
    destinationGas: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        chainId: number;
        address: string;
        decimals: number;
        symbol: string;
      };
    };
    relayerCapital: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        decimals: number;
        symbol: string;
        address: string;
        name: string;
        chainId: number;
      };
    };
    lpFee: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        decimals: number;
        symbol: string;
        address: string;
        name: string;
        chainId: number;
      };
    };
    relayerTotal: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        decimals: number;
        symbol: string;
        address: string;
        name: string;
        chainId: number;
      };
    };
    app: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        decimals: number;
        symbol: string;
        address: string;
        name: string;
        chainId: number;
      };
    };
    swap?: {
      amount: string;
      amountUsd: string;
      pct: string;
      token: {
        decimals: number;
        symbol: string;
        address: string;
        name: string;
        chainId: number;
      };
    };
  };
};

export type SwapApprovalApiQueryParams = {
  amount: string;
  tradeType: "minOutput" | "exactOutput" | "exactInput";
  inputToken: string;
  outputToken: string;
  originChainId: number;
  destinationChainId: number;
  depositor: string;
  recipient: string;
  integratorId?: string;
  refundAddress?: string;
  refundOnOrigin?: boolean;
  slippageTolerance?: number;
  skipOriginTxEstimation?: boolean;
};

export async function swapApprovalApiCall(params: SwapApprovalApiQueryParams) {
  const response = await axios.get<SwapApprovalApiResponse>(
    `${vercelApiBaseUrl}/api/swap/approval`,
    {
      params,
    }
  );

  const result = response.data;

  return {
    checks: {
      allowance: {
        token: result.checks.allowance.token,
        spender: result.checks.allowance.spender,
        actual: BigNumber.from(result.checks.allowance.actual),
        expected: BigNumber.from(result.checks.allowance.expected),
      },
      balance: {
        token: result.checks.balance.token,
        actual: BigNumber.from(result.checks.balance.actual),
        expected: BigNumber.from(result.checks.balance.expected),
      },
    },
    approvalTxns: result.approvalTxns,
    steps: {
      originSwap: result.steps.originSwap
        ? {
            tokenIn: result.steps.originSwap.tokenIn,
            tokenOut: result.steps.originSwap.tokenOut,
            inputAmount: BigNumber.from(result.steps.originSwap.inputAmount),
            outputAmount: BigNumber.from(result.steps.originSwap.outputAmount),
            minOutputAmount: BigNumber.from(
              result.steps.originSwap.minOutputAmount
            ),
            maxInputAmount: BigNumber.from(
              result.steps.originSwap.maxInputAmount
            ),
            swapProvider: result.steps.originSwap.swapProvider,
          }
        : undefined,
      bridge: {
        inputAmount: BigNumber.from(result.steps.bridge.inputAmount),
        outputAmount: BigNumber.from(result.steps.bridge.outputAmount),
        tokenIn: result.steps.bridge.tokenIn,
        tokenOut: result.steps.bridge.tokenOut,
        fees: {
          totalRelay: {
            pct: BigNumber.from(result.steps.bridge.fees.totalRelay.pct),
            total: BigNumber.from(result.steps.bridge.fees.totalRelay.total),
          },
          relayerCapital: {
            pct: BigNumber.from(result.steps.bridge.fees.relayerCapital.pct),
            total: BigNumber.from(
              result.steps.bridge.fees.relayerCapital.total
            ),
          },
          relayerGas: {
            pct: BigNumber.from(result.steps.bridge.fees.relayerGas.pct),
            total: BigNumber.from(result.steps.bridge.fees.relayerGas.total),
          },
          lp: {
            pct: BigNumber.from(result.steps.bridge.fees.lp.pct),
            total: BigNumber.from(result.steps.bridge.fees.lp.total),
          },
        },
      },
      destinationSwap: result.steps.destinationSwap
        ? {
            tokenIn: result.steps.destinationSwap.tokenIn,
            tokenOut: result.steps.destinationSwap.tokenOut,
            inputAmount: BigNumber.from(
              result.steps.destinationSwap.inputAmount
            ),
            maxInputAmount: BigNumber.from(
              result.steps.destinationSwap.maxInputAmount
            ),
            outputAmount: BigNumber.from(
              result.steps.destinationSwap.outputAmount
            ),
            minOutputAmount: BigNumber.from(
              result.steps.destinationSwap.minOutputAmount
            ),
            swapProvider: result.steps.destinationSwap.swapProvider,
          }
        : undefined,
    },
    refundToken: result.refundToken,
    inputAmount: BigNumber.from(result.inputAmount),
    expectedOutputAmount: BigNumber.from(result.expectedOutputAmount),
    minOutputAmount: BigNumber.from(result.minOutputAmount),
    expectedFillTime: result.expectedFillTime,
    swapTx: {
      simulationSuccess: result.swapTx.simulationSuccess,
      chainId: result.swapTx.chainId,
      to: result.swapTx.to,
      data: result.swapTx.data,
      value: result.swapTx.value
        ? BigNumber.from(result.swapTx.value)
        : undefined,
      gas: result.swapTx.gas ? BigNumber.from(result.swapTx.gas) : undefined,
      maxFeePerGas: result.swapTx.maxFeePerGas
        ? BigNumber.from(result.swapTx.maxFeePerGas)
        : undefined,
      maxPriorityFeePerGas: result.swapTx.maxPriorityFeePerGas
        ? BigNumber.from(result.swapTx.maxPriorityFeePerGas)
        : undefined,
    },
  };
}
