import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { indexerApiBaseUrl } from "utils";

export type IndexerDeposit = {
  id: number;
  relayHash: string;
  depositId: string;
  originChainId: string;
  destinationChainId: string;
  depositor: string;
  recipient: string;
  inputToken: string;
  inputAmount: string;
  outputToken: string;
  outputAmount: string;
  message: string;
  messageHash: string;
  exclusiveRelayer: string;
  exclusivityDeadline: string | null;
  fillDeadline: string;
  quoteTimestamp: string;
  depositTxHash: string;
  depositBlockNumber: number;
  depositBlockTimestamp: string;
  status: "filled" | "pending" | "unfilled" | string;
  depositRefundTxHash: string | null;
  swapTokenPriceUsd: string | null;
  swapFeeUsd: string | null;
  bridgeFeeUsd: string;
  inputPriceUsd: string;
  outputPriceUsd: string;
  fillGasFee: string;
  fillGasFeeUsd: string;
  fillGasTokenPriceUsd: string;
  actionsSucceeded: boolean | null;
  actionsTargetChainId: string | null;
  swapTransactionHash: string | null;
  swapToken: string | null;
  swapTokenAmount: string | null;
  relayer: string;
  fillBlockTimestamp: string | null;
  fillTx: string;
  depositTxnRef: string;
  depositRefundTxnRef: string | null;
};

export type IndexerDepositResponse = {
  deposit: IndexerDeposit;
  pagination: {
    currentIndex: number;
    maxIndex: number;
  };
};

async function getDepositByTxHash(depositTxHash: string) {
  const { data } = await axios.get<IndexerDepositResponse>(
    `${indexerApiBaseUrl}/deposit`,
    {
      params: {
        depositTxHash,
      },
    }
  );
  return data;
}

export function useDepositByTxHash(depositTxHash?: string) {
  return useQuery({
    queryKey: ["deposit", depositTxHash],
    queryFn: () => getDepositByTxHash(depositTxHash!),
    enabled: !!depositTxHash,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
