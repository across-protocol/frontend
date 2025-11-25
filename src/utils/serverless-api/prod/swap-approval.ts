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

type FeeComponent = {
  amount: string;
  amountUsd: string;
  pct?: string;
  token: SwapApiToken;
};

type AcrossBridgeFeeDetails = {
  type: "across";
  lp: FeeComponent;
  relayerCapital: FeeComponent;
  destinationGas: FeeComponent;
};

type TotalFeeBreakdownDetails = {
  type: "TOTAL_BREAKDOWN";
  swapImpact: FeeComponent;
  app: FeeComponent;
  bridge: FeeComponent & { details?: AcrossBridgeFeeDetails };
};

type MaxTotalFeeBreakdownDetails = {
  type: "MAX_TOTAL_BREAKDOWN";
  maxSwapImpact: FeeComponent;
  app: FeeComponent;
  bridge: FeeComponent & { details?: AcrossBridgeFeeDetails };
};

export type SwapApprovalApiResponse = {
  crossSwapType: string;
  amountType: string;
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
  approvalTxns?: {
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
      slippage: number;
    };
    bridge: {
      inputAmount: string;
      outputAmount: string;
      tokenIn: SwapApiToken;
      tokenOut: SwapApiToken;
      fees: {
        amount: string;
        pct: string;
        token: SwapApiToken;
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
      provider: string;
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
      slippage: number;
    };
  };
  inputToken: SwapApiToken;
  outputToken: SwapApiToken;
  refundToken: SwapApiToken;
  inputAmount: string;
  maxInputAmount: string;
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
  fees?: {
    total: FeeComponent & { details: TotalFeeBreakdownDetails };
    totalMax: FeeComponent & { details: MaxTotalFeeBreakdownDetails };
    originGas: FeeComponent;
  };
  eip712?: any;
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

export type SwapApprovalQuote = Awaited<ReturnType<typeof swapApprovalApiCall>>;

export async function swapApprovalApiCall(params: SwapApprovalApiQueryParams) {
  const response = await axios.get<SwapApprovalApiResponse>(
    `${vercelApiBaseUrl}/api/swap/approval`,
    {
      params,
    }
  );

  const result = response.data;

  // Helper function to convert fee component
  const convertFeeComponent = (fee: FeeComponent) => ({
    amount: BigNumber.from(fee.amount),
    amountUsd: fee.amountUsd,
    pct: fee.pct ? BigNumber.from(fee.pct) : undefined,
    token: fee.token,
  });

  return {
    crossSwapType: result.crossSwapType,
    amountType: result.amountType,
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
            slippage: result.steps.originSwap.slippage,
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
          token: result.steps.bridge.fees.token,
          details:
            result.steps.bridge.fees.details?.type === "across"
              ? {
                  type: "across",
                  lp: {
                    amount: BigNumber.from(
                      result.steps.bridge.fees.details.lp.amount
                    ),
                    pct: BigNumber.from(
                      result.steps.bridge.fees.details.lp.pct
                    ),
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
                }
              : undefined,
        },
        provider: result.steps.bridge.provider,
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
            slippage: result.steps.destinationSwap.slippage,
          }
        : undefined,
    },
    inputToken: result.inputToken,
    outputToken: result.outputToken,
    refundToken: result.refundToken,
    inputAmount: BigNumber.from(result.inputAmount),
    maxInputAmount: BigNumber.from(result.maxInputAmount),
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
    fees: result.fees
      ? {
          total: {
            ...convertFeeComponent(result.fees.total),
            details: {
              type: result.fees.total.details.type,
              swapImpact: convertFeeComponent(
                result.fees.total.details.swapImpact
              ),
              app: convertFeeComponent(result.fees.total.details.app),
              bridge: {
                ...convertFeeComponent(result.fees.total.details.bridge),
                details:
                  result.fees.total.details?.bridge?.details?.type === "across"
                    ? {
                        type: result.fees.total.details.bridge.details.type,
                        lp: convertFeeComponent(
                          result.fees.total.details.bridge.details.lp
                        ),
                        relayerCapital: convertFeeComponent(
                          result.fees.total.details.bridge.details
                            .relayerCapital
                        ),
                        destinationGas: convertFeeComponent(
                          result.fees.total.details.bridge.details
                            .destinationGas
                        ),
                      }
                    : undefined,
              },
            },
          },
          totalMax: {
            ...convertFeeComponent(result.fees.totalMax),
            details: {
              type: result.fees.totalMax.details.type,
              maxSwapImpact: convertFeeComponent(
                result.fees.totalMax.details.maxSwapImpact
              ),
              app: convertFeeComponent(result.fees.totalMax.details.app),
              bridge: {
                ...convertFeeComponent(result.fees.totalMax.details.bridge),
                details:
                  result.fees.totalMax.details?.bridge?.details?.type ===
                  "across"
                    ? {
                        type: result.fees.totalMax.details.bridge.details.type,
                        lp: convertFeeComponent(
                          result.fees.totalMax.details.bridge.details.lp
                        ),
                        relayerCapital: convertFeeComponent(
                          result.fees.totalMax.details.bridge.details
                            .relayerCapital
                        ),
                        destinationGas: convertFeeComponent(
                          result.fees.totalMax.details.bridge.details
                            .destinationGas
                        ),
                      }
                    : undefined,
              },
            },
          },
          originGas: convertFeeComponent(result.fees.originGas),
        }
      : undefined,
    eip712: result.eip712,
  };
}

export type SwapApprovalApiCallReturnType = Awaited<
  ReturnType<typeof swapApprovalApiCall>
>;
