import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BigNumber } from "ethers";
import { useConnection } from "hooks";
import { vercelApiBaseUrl } from "utils";
import {
  SwapApiToken,
  SwapApprovalApiQueryParams,
  SwapApprovalApiResponse,
} from "utils/serverless-api/prod/swap-approval";

type SwapQuoteParams = {
  origin: SwapApiToken | null;
  destination: SwapApiToken | null;
  amount: BigNumber | null;
  isInputAmount: boolean;
  recipient?: string;
  integratorId?: string;
  refundAddress?: string;
  refundOnOrigin?: boolean;
  slippageTolerance?: number;
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
    queryFn: async (): Promise<SwapApprovalApiResponse | undefined> => {
      if (Number(amount) <= 0) {
        return undefined;
      }
      if (!origin || !destination || !amount || !depositor) {
        throw new Error("Missing required swap quote parameters");
      }

      const params: SwapApprovalApiQueryParams = {
        tradeType: isInputAmount ? "exactInput" : "minOutput",
        inputToken: origin.address,
        outputToken: destination.address,
        originChainId: origin.chainId,
        destinationChainId: destination.chainId,
        depositor,
        recipient: recipient || depositor,
        amount: amount.toString(),
        refundOnOrigin,
        slippageTolerance,
        ...(integratorId ? { integratorId } : {}),
        ...(refundAddress ? { refundAddress } : {}),
      };

      const { data } = await axios.get(
        `${vercelApiBaseUrl}/api/swap/approval`,
        {
          params,
        }
      );
      return data;
    },
    enabled:
      !!origin?.address && !!destination?.address && !!amount && !!depositor,
    refetchInterval: 5_000,
  });

  return { data, isLoading, error };
};

export default useSwapQuote;
