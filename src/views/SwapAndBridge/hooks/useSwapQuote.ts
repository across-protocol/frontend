import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BigNumber } from "ethers";
import { useConnection } from "hooks";
import { vercelApiBaseUrl } from "utils";

type TokenParam = {
  address: string;
  chainId: number;
};

type SwapQuoteParams = {
  origin: TokenParam | null;
  destination: TokenParam | null;
  amount: BigNumber | null;
  isInputAmount: boolean;
  recipient?: string;
  integratorId?: string;
  refundAddress?: string;
  refundOnOrigin?: boolean;
  slippageTolerance?: number;
};

type SwapTransaction = {
  simulationSuccess: boolean;
  chainId: number;
  to: string;
  data: string;
  value?: string;
  gas?: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

type SwapQuoteResponse = {
  checks: object;
  steps: object;
  refundToken: object;
  inputAmount: string;
  expectedOutputAmount: string;
  minOutputAmount: string;
  expectedFillTime: number;
  swapTx: SwapTransaction;
  approvalTxns: {
    chainId: number;
    data: string;
    to: string;
  }[];
};

const useSwapQuote = ({
  origin,
  destination,
  amount,
  isInputAmount,
  recipient,
  integratorId,
  refundAddress,
  refundOnOrigin = true,
  slippageTolerance = 1,
}: SwapQuoteParams) => {
  const { account: depositor } = useConnection();
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "swap-quote",
      origin,
      destination,
      amount,
      isInputAmount,
      depositor,
      recipient,
    ],
    queryFn: async (): Promise<SwapQuoteResponse> => {
      const { data } = await axios.get(
        `${vercelApiBaseUrl}/api/swap/approval`,
        {
          params: {
            tradeType: isInputAmount ? "exactInput" : "minOutput",
            inputToken: origin?.address,
            outputToken: destination?.address,
            originChainId: origin?.chainId,
            destinationChainId: destination?.chainId,
            depositor,
            recipient: recipient || depositor,
            ...(integratorId && { integratorId }),
            ...(refundAddress && { refundAddress }),
            amount: amount?.toString(),
            refundOnOrigin,
            slippageTolerance,
          },
        }
      );
      return data;
    },
    enabled:
      !!origin?.address && !!destination?.address && !!amount && !!depositor,
    refetchInterval: 2_000,
  });

  return { data, isLoading, error };
};

export default useSwapQuote;
