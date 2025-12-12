import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { indexerApiBaseUrl } from "utils";

export type IndexerDeposit = {
  actionsSucceeded: boolean | null;
  actionsTargetChainId: string | null;
  bridgeFeeUsd: string;
  depositBlockNumber: number;
  depositBlockTimestamp: string;
  depositId: string;
  depositRefundTxHash: string | null;
  depositRefundTxnRef: string | null;
  depositTxHash: string;
  depositTxnRef: string;
  depositor: string;
  destinationChainId: string;
  exclusiveRelayer: string;
  exclusivityDeadline: string | null;
  fillBlockTimestamp: string | null;
  fillDeadline: string;
  fillGasFee: string;
  fillGasFeeUsd: string;
  fillGasTokenPriceUsd: string;
  fillTx: string;
  id: number;
  inputAmount: string;
  inputPriceUsd: string;
  inputToken: string;
  message: string;
  messageHash: string;
  originChainId: string;
  outputAmount: string;
  outputPriceUsd: string;
  outputToken: string;
  quoteTimestamp: string;
  recipient: string;
  relayHash: string;
  relayer: string;
  status: "filled" | "pending" | "unfilled" | string;
  swapFeeUsd: string | null;
  swapToken: string | null;
  swapTokenAmount: string | null;
  swapTokenPriceUsd: string | null;
  swapTransactionHash: string | null;
};

export type IndexerDepositResponse = {
  deposit: IndexerDeposit;
  pagination: {
    currentIndex: number;
    maxIndex: number;
  };
};

export function useDepositByTxHash(depositTxHash?: string) {
  return useQuery({
    queryKey: ["deposit", depositTxHash],
    queryFn: async () => {
      const { data } = await axios.get<IndexerDepositResponse>(
        `${indexerApiBaseUrl}/deposit`,
        { params: { depositTxHash } }
      );
      return data;
    },
    enabled: !!depositTxHash,
    refetchInterval: 10000,
  });
}
