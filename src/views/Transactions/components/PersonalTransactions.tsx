import { useHistory } from "react-router-dom";
import { useQueryClient } from "react-query";

import { PaginatedDepositsTable } from "components/DepositsTable";
import { Text } from "components/Text";
import { SecondaryButton } from "components";
import { useConnection } from "hooks";
import { getConfig } from "utils";

import { EmptyTable } from "./EmptyTable";
import { usePersonalTransactions } from "../hooks/usePersonalTransactions";
import { DepositStatusFilter } from "../types";
import { SpeedUpModal } from "./SpeedUpModal";

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
          onClick={() => {
            queryClient.cancelQueries({ queryKey: ["deposits"] });
            queryClient.invalidateQueries({ queryKey: ["deposits"] });
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
        deposits={deposits}
        totalCount={totalDeposits}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        initialPageSize={pageSize}
        onClickSpeedUp={setDepositToSpeedUp}
        // NOTE: Disabled until fully supported by scraper
        disabledColumns={["loyaltyRate", "rewards"]}
      />
    </>
  );
}
