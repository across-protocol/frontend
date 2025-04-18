import axios from "axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  depositsQueryKey,
  userDepositsQueryKey,
  defaultRefetchInterval,
  indexerApiBaseUrl,
} from "utils";
import {
  getLocalDepositEntries,
  removeLocalDeposits,
} from "../utils/local-deposits";
import { DepositStatusFilter } from "views/Transactions/types";

export type DepositStatus = "pending" | "filled" | "refunded" | "expired";

export type SpeedUpDepositTx = {
  hash: string;
  blockNumber: number;
  newRelayerFeePct: string;
  depositSourceChainId: number;
};

export type Deposit = {
  depositId: string;
  depositTime: number;
  status: DepositStatus;
  filled: string;
  sourceChainId: number;
  destinationChainId: number;
  assetAddr: string;
  depositorAddr: string;
  recipientAddr: string;
  message: string;
  amount: string;
  depositTxHash: string;
  fillTxs: string[];
  speedUps: SpeedUpDepositTx[];
  depositRelayerFeePct: string;
  initialRelayerFeePct?: string;
  suggestedRelayerFeePct?: string;
  fillTime?: number;
  fillDeadline?: string;
  rewards?: {
    type: "op-rebates" | "arb-rebates";
    rate: number;
    amount: string;
    usd: string;
  };
  feeBreakdown?: {
    // lp fee
    lpFeeUsd: string;
    lpFeePct: string; // wei pct
    lpFeeAmount: string;
    // relayer fee
    relayCapitalFeeUsd: string;
    relayCapitalFeePct: string; // wei pct
    relayCapitalFeeAmount: string;
    relayGasFeeUsd: string;
    relayGasFeePct: string; // wei pct
    relayGasFeeAmount: string;
    // total = lp fee + relayer fee
    totalBridgeFeeUsd: string;
    totalBridgeFeePct: string; // wei pct
    totalBridgeFeeAmount: string;
    // swap fee
    swapFeeUsd?: string;
    swapFeePct?: string; // wei pct
    swapFeeAmount?: string;
  };
  token?: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  outputToken?: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  swapToken?: {
    address: string;
    symbol?: string;
    name?: string;
    decimals?: number;
  };
  swapTokenAmount?: string;
  swapTokenAddress?: string;
  depositRefundTxHash?: string;
};

export type Pagination = {
  total: number;
  limit: number;
  offset: number;
};

export type GetDepositsResponse = {
  pagination: Pagination;
  deposits: Deposit[];
};

export type IndexerDeposit = {
  id: number;
  relayHash: string;
  depositId: string;
  originChainId: number;
  destinationChainId: number;
  depositor: string;
  recipient: string;
  inputToken: string;
  inputAmount: string;
  outputToken: string;
  outputAmount: string;
  message: string;
  messageHash: string;
  exclusiveRelayer: string;
  exclusivityDeadline: string;
  fillDeadline: string;
  quoteTimestamp: string;
  depositTransactionHash: string;
  depositBlockNumber: number;
  depositBlockTimestamp: string;
  status: "unfilled" | "filled";
  depositRefundTxHash: string;
  swapTokenPriceUsd: string;
  swapFeeUsd: string;
  bridgeFeeUsd: string;
  inputPriceUsd: string;
  outputPriceUsd: string;
  fillGasFee: string;
  fillGasFeeUsd: string;
  fillGasTokenPriceUsd: string;
  swapTransactionHash: string;
  swapToken: string;
  swapTokenAmount: string;
  relayer: string;
  fillBlockTimestamp: string;
  fillTransactionHash: string;
  speedups: any[];
};

export type GetIndexerDepositsResponse = IndexerDeposit[];

export function useDeposits(
  status: DepositStatusFilter,
  limit: number,
  offset: number = 0
) {
  return useQuery({
    queryKey: depositsQueryKey(status, limit, offset),
    queryFn: () => {
      return getDeposits({
        status: status === "all" ? undefined : status,
        limit,
        offset,
        skipOldUnprofitable: true,
      });
    },
    placeholderData: keepPreviousData,
    refetchInterval: defaultRefetchInterval,
  });
}

export function useUserDeposits(
  status: DepositStatusFilter,
  limit: number,
  offset: number = 0,
  userAddress?: string
) {
  return useQuery({
    queryKey: userDepositsQueryKey(userAddress!, status, limit, offset),
    queryFn: async () => {
      if (!userAddress) {
        return {
          deposits: [],
          pagination: {
            total: 0,
            limit: 0,
            offset: 0,
          },
        };
      }

      const omitStatusFilter = status === "all";
      const deposits = await getDeposits({
        address: userAddress,
        status: omitStatusFilter ? undefined : status,
        limit,
        offset,
      });

      return {
        deposits,
      };
    },
    placeholderData: keepPreviousData,
    refetchInterval: defaultRefetchInterval,
    enabled: Boolean(userAddress),
  });
}

async function getDeposits(
  params: Partial<{
    skipOldUnprofitable: boolean;
    address: string;
    status: DepositStatus;
    limit: number;
    offset: number;
  }> = {}
) {
  const { data } = await axios.get<GetIndexerDepositsResponse>(
    `${indexerApiBaseUrl}/deposits`,
    {
      params: {
        status: params.status === "pending" ? "unfilled" : params.status,
        limit: params.limit,
        skip: params.offset,
        depositor: params.address,
      },
    }
  );
  return data;
}
