import { useHistory } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";
import { getConfig } from "utils";
import { EmptyTable } from "./EmptyTable";
import { DepositStatusFilter } from "../types";
import { SpeedUpModal } from "./SpeedUpModal";
import { useTransactions } from "../hooks/useTransactions";
import { useStreamingDeposits } from "../hooks/useStreamingDeposits";
import { convertIndexerDepositToDeposit } from "../utils/convertDeposit";

type Props = {
  statusFilter: DepositStatusFilter;
};

export function AllTransactions({ statusFilter }: Props) {
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
  } = useTransactions(statusFilter);

  const history = useHistory();
  const queryClient = useQueryClient();

  const streamingEnabled = currentPage === 0;
  const streamedDeposits = useStreamingDeposits(
    deposits,
    pageSize,
    streamingEnabled
  );

  const convertedDeposits = useMemo(
    () =>
      streamedDeposits.map((deposit) =>
        convertIndexerDepositToDeposit(deposit)
      ),
    [streamedDeposits]
  );

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
