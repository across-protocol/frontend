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
    };
    bridge: {
      inputAmount: string;
      outputAmount: string;
      tokenIn: SwapApiToken;
      tokenOut: SwapApiToken;
      fees: {
        amount: string;
        pct: string;
        details: {
          type: "across";
          lp: {
            amount: string;
            pct: string;
          };
          relayerCapital: {
            amount: string;
            pct: string;
          };
          destinationGas: {
            amount: string;
            pct: string;
          };
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
    value: string;
    gas?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
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
          }
        : undefined,
      bridge: {
        inputAmount: BigNumber.from(result.steps.bridge.inputAmount),
        outputAmount: BigNumber.from(result.steps.bridge.outputAmount),
        tokenIn: result.steps.bridge.tokenIn,
        tokenOut: result.steps.bridge.tokenOut,
        fees: {
          amount: BigNumber.from(result.steps.bridge.fees.amount),
          pct: BigNumber.from(result.steps.bridge.fees.pct),
          details: {
            type: "across",
            lp: {
              amount: BigNumber.from(
                result.steps.bridge.fees.details.lp.amount
              ),
              pct: BigNumber.from(result.steps.bridge.fees.details.lp.pct),
            },
            relayerCapital: {
              amount: BigNumber.from(
                result.steps.bridge.fees.details.relayerCapital.amount
              ),
              pct: BigNumber.from(
                result.steps.bridge.fees.details.relayerCapital.pct
              ),
            },
            destinationGas: {
              amount: BigNumber.from(
                result.steps.bridge.fees.details.destinationGas.amount
              ),
              pct: BigNumber.from(
                result.steps.bridge.fees.details.destinationGas.pct
              ),
            },
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
      value: BigNumber.from(result.swapTx.value || "0"),
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
