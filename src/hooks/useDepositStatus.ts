import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export type DepositStatusResponse = {
  status: "filled" | "pending" | string;
  originChainId: number;
  depositId: string;
  depositTxnRef: string;
  fillTxnRef?: string;
  destinationChainId: number;
  depositRefundTxnRef?: string;
  actionsSucceeded?: boolean;
  pagination?: {
    currentIndex: number;
    maxIndex: number;
  };
};

const ACROSS_API_URL = "https://app.across.to/api";

async function getDepositStatus(depositTxnRef: string) {
  const { data } = await axios.get<DepositStatusResponse>(
    `${ACROSS_API_URL}/deposit/status`,
    {
      params: {
        depositTxnRef,
      },
    }
  );
  return data;
}

export function useDepositStatus(depositTxnRef?: string) {
  return useQuery({
    queryKey: ["depositStatus", depositTxnRef],
    queryFn: () => getDepositStatus(depositTxnRef!),
    enabled: !!depositTxnRef,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
