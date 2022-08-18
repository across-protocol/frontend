import { TransactionsLayout } from "./components/TransactionsLayout";
import { TransactionsTableWithPagination } from "./components/TransactionsTable";

import { useAllTransactionsView } from "./hooks/useAllTransactionsView";

import { getSupportedTxTuples } from "./utils";

export function AllTransactions() {
  const {
    paginatedFillDeposits,
    paginatedPendingDeposits,
    isMobile,
    pageSize,
    handlePageSizeChange,
  } = useAllTransactionsView();

  const isLoading =
    paginatedFillDeposits.depositsQuery.isLoading ||
    paginatedPendingDeposits.depositsQuery.isLoading;

  const showPendingTransactions =
    !isLoading && paginatedPendingDeposits.depositsQuery.deposits.length > 0;

  const showNoTransactionsFound =
    !paginatedFillDeposits.depositsQuery.deposits.length &&
    !paginatedPendingDeposits.depositsQuery.deposits.length &&
    !isLoading;

  return (
    <TransactionsLayout
      showNoTransactionsFound={showNoTransactionsFound}
      showPendingTransactions={showPendingTransactions}
      showLoading={isLoading}
      ethNoteWrapperText={
        "Note - ETH transfers will appear as WETH but you will receive ETH"
      }
      TitleContent={"All Transactions"}
      PendingTransactionsTable={
        <TransactionsTableWithPagination
          isMobile={isMobile}
          title="Ongoing"
          transferTuples={getSupportedTxTuples(
            paginatedPendingDeposits.transfers
          )}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={paginatedPendingDeposits.handlePageChange}
          paginateValues={paginatedPendingDeposits.depositsPaginateValues}
          currentPage={paginatedPendingDeposits.currentPage}
          enablePartialFillInfoIcon
        />
      }
      FilledTransactionsTable={
        <TransactionsTableWithPagination
          isMobile={isMobile}
          title="History"
          transferTuples={getSupportedTxTuples(paginatedFillDeposits.transfers)}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={paginatedFillDeposits.handlePageChange}
          paginateValues={paginatedFillDeposits.depositsPaginateValues}
          currentPage={paginatedFillDeposits.currentPage}
        />
      }
    />
  );
}
