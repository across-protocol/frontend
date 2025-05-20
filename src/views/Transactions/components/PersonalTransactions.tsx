import { useHistory } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";
import { useConnection } from "hooks";
import { getConfig } from "utils";

import { EmptyTable } from "./EmptyTable";
import { usePersonalTransactions } from "../hooks/usePersonalTransactions";
import { DepositStatusFilter } from "../types";
import { SpeedUpModal } from "./SpeedUpModal";
import { Deposit, IndexerDeposit } from "hooks/useDeposits";

type Props = {
  statusFilter: DepositStatusFilter;
};

export function PersonalTransactions({ statusFilter }: Props) {
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageSizeChange,
    deposits,
    totalDeposits,
    depositsQuery,
    setDepositToSpeedUp,
    depositToSpeedUp,
  } = usePersonalTransactions(statusFilter);
  const { isConnected, connect } = useConnection();
  const history = useHistory();
  const queryClient = useQueryClient();

  const convertedDeposits = useMemo(
    () => deposits.map((deposit) => convertIndexerDepositToDeposit(deposit)),
    [deposits]
  );

  if (!isConnected) {
    return (
      <EmptyTable>
        <Text size="lg">Please connect your wallet to view transactions</Text>
        <SecondaryButton
          data-cy="connect-wallet"
          size="md"
          onClick={() => connect()}
        >
          Connect Wallet
        </SecondaryButton>
      </EmptyTable>
    );
  }

  if (depositsQuery.isLoading) {
    return (
      <EmptyTable>
        <Text size="lg">Loading...</Text>
      </EmptyTable>
    );
  }

  if (depositsQuery.isError) {
    return (
      <EmptyTable>
        <Text size="lg">Something went wrong... Please try again later</Text>
        <SecondaryButton
          size="md"
          onClick={async () => {
            await queryClient.cancelQueries({ queryKey: ["deposits"] });
            await queryClient.resetQueries({ queryKey: ["deposits"] });
            depositsQuery.refetch();
          }}
        >
          Reload data
        </SecondaryButton>
      </EmptyTable>
    );
  }

  if (currentPage === 0 && deposits.length === 0) {
    return (
      <EmptyTable>
        <Text size="lg">You have no personal transactions yet</Text>
        <SecondaryButton size="md" onClick={() => history.push("/")}>
          Bridge with Across
        </SecondaryButton>
      </EmptyTable>
    );
  }

  return (
    <>
      {depositToSpeedUp && (
        <SpeedUpModal
          isOpen={Boolean(depositToSpeedUp)}
          onClose={() => setDepositToSpeedUp(undefined)}
          txTuple={[
            getConfig().getTokenInfoByAddress(
              depositToSpeedUp.sourceChainId,
              depositToSpeedUp.assetAddr
            ),
            depositToSpeedUp,
          ]}
        />
      )}
      <PaginatedDepositsTable
        currentPage={currentPage}
        currentPageSize={pageSize}
        deposits={convertedDeposits}
        totalCount={totalDeposits}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        initialPageSize={pageSize}
        onClickSpeedUp={setDepositToSpeedUp}
        filterKey={`personal-${statusFilter}`}
        disabledColumns={["bridgeFee", "rewards", "rewardsRate"]}
        displayPageNumbers={false}
      />
    </>
  );
}

function convertIndexerDepositToDeposit(
  indexerDeposit: IndexerDeposit
): Deposit {
  return {
    depositId: indexerDeposit.depositId,
    depositTime:
      new Date(indexerDeposit.depositBlockTimestamp).getTime() / 1000,
    status:
      indexerDeposit.status === "unfilled" ? "pending" : indexerDeposit.status,
    filled: "0",
    sourceChainId: indexerDeposit.originChainId,
    destinationChainId: indexerDeposit.destinationChainId,
    assetAddr: indexerDeposit.inputToken,
    depositorAddr: indexerDeposit.depositor,
    recipientAddr: indexerDeposit.recipient,
    message: indexerDeposit.message,
    amount: indexerDeposit.inputAmount,
    depositTxHash:
      indexerDeposit.depositTransactionHash || indexerDeposit.depositTxHash,
    fillTxs: indexerDeposit.fillTx ? [indexerDeposit.fillTx] : [],
    speedUps: indexerDeposit.speedups,
    depositRelayerFeePct: "0",
    initialRelayerFeePct: "0",
    suggestedRelayerFeePct: "0",
    fillTime: new Date(indexerDeposit.fillBlockTimestamp).getTime() / 1000,
    fillDeadline: indexerDeposit.fillDeadline,
    rewards: undefined,
    feeBreakdown: indexerDeposit.bridgeFeeUsd
      ? {
          // lp fee
          lpFeeUsd: "0",
          lpFeePct: "0", // wei pct
          lpFeeAmount: "0",
          // relayer fee
          relayCapitalFeeUsd: "0",
          relayCapitalFeePct: "0", // wei pct
          relayCapitalFeeAmount: "0",
          relayGasFeeUsd: indexerDeposit.fillGasFeeUsd,
          relayGasFeePct: "0", // wei pct
          relayGasFeeAmount: "0",
          // total = lp fee + relayer fee
          totalBridgeFeeUsd: indexerDeposit.bridgeFeeUsd,
          totalBridgeFeePct: "0", // wei pct
          totalBridgeFeeAmount: "0",
          // swap fee
          swapFeeUsd: indexerDeposit.swapFeeUsd,
          swapFeePct: "0", // wei pct
          swapFeeAmount: "0",
        }
      : undefined,
    token: {
      address: indexerDeposit.inputToken,
      symbol: undefined,
      name: undefined,
      decimals: undefined,
    },
    outputToken: {
      address: indexerDeposit.outputToken,
      symbol: undefined,
      name: undefined,
      decimals: undefined,
    },
    swapToken: {
      address: indexerDeposit.swapToken,
      symbol: undefined,
      name: undefined,
      decimals: undefined,
    },
    swapTokenAmount: indexerDeposit.swapTokenAmount,
    swapTokenAddress: indexerDeposit.swapToken,
    depositRefundTxHash: indexerDeposit.depositRefundTxHash,
  };
}
