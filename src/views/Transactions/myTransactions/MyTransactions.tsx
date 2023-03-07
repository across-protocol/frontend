import { shortenAddress } from "utils";

import { TransactionsTableWithPagination } from "../components/TransactionsTable";

import { useMyTransactionsView } from "../hooks/useMyTransactionsView";

import { ConnectButton, Account, ButtonWrapper } from "../Transactions.styles";
import { TransactionsLayout } from "../components/TransactionsLayout";
import { getSupportedTxTuples } from "../utils";

const MyTransactions = () => {
  const {
    connectWallet,
    account,
    isConnected,
    paginatedFillUserDeposits,
    paginatedPendingUserDeposits,
    isMobile,
    pageSize,
    handlePageSizeChange,
  } = useMyTransactionsView();

  const isLoading =
    paginatedFillUserDeposits.depositsQuery.isLoading ||
    paginatedPendingUserDeposits.depositsQuery.isLoading;

  const showPendingTransactions =
    !isLoading &&
    (paginatedPendingUserDeposits.depositsQuery.data?.deposits?.length || 0) >
      0;

  const showNoTransactionsFound =
    !paginatedFillUserDeposits.depositsQuery.data?.deposits?.length &&
    !paginatedPendingUserDeposits.depositsQuery.data?.deposits.length &&
    !isLoading;

  return (
    <TransactionsLayout
      showNoTransactionsFound={showNoTransactionsFound}
      showPendingTransactions={showPendingTransactions}
      showFilledTransactions={isConnected}
      showLoading={isLoading}
      ethNoteWrapperText={
        "Note - ETH transfers will appear as WETH but you will receive ETH"
      }
      TitleContent={
        <>
          My Transactions
          {account && (
            <Account>({shortenAddress(account, "......", 6)})</Account>
          )}
        </>
      }
      TopRowButton={
        <>
          {!isConnected && (
            <ButtonWrapper>
              <ConnectButton
                onClick={() => connectWallet()}
                data-cy="connect-wallet"
              >
                Connect Wallet
              </ConnectButton>
            </ButtonWrapper>
          )}
        </>
      }
      PendingTransactionsTable={
        <TransactionsTableWithPagination
          title="Ongoing"
          transferTuples={getSupportedTxTuples(
            paginatedPendingUserDeposits.transfers
          )}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={paginatedPendingUserDeposits.handlePageChange}
          paginateValues={paginatedPendingUserDeposits.depositsPaginateValues}
          currentPage={paginatedPendingUserDeposits.currentPage}
          enablePartialFillInfoIcon
          isMobile={isMobile}
          enableSpeedUps
        />
      }
      FilledTransactionsTable={
        <TransactionsTableWithPagination
          isMobile={isMobile}
          title="History"
          transferTuples={getSupportedTxTuples(
            paginatedFillUserDeposits.transfers
          )}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={paginatedFillUserDeposits.handlePageChange}
          paginateValues={paginatedFillUserDeposits.depositsPaginateValues}
          currentPage={paginatedFillUserDeposits.currentPage}
        />
      }
    />
  );
};

export default MyTransactions;
