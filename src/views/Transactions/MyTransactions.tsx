import { shortenAddress } from "utils";

import {
  TransactionsTable,
  TransactionsTableWithPagination,
} from "./components/TransactionsTable";

import { useMyTransactionsView } from "./hooks/useMyTransactionsView";

import { ConnectButton, Account, ButtonWrapper } from "./Transactions.styles";
import { TransactionsLayout } from "./components/TransactionsLayout";

const MyTransactions = () => {
  const {
    connectWallet,
    account,
    isConnected,
    pendingTransferTuples,
    isMobile,
    initialLoading,
    filledTransferTuples,
    filledTransfersPagination,
  } = useMyTransactionsView();

  const showNoTransactionsFound =
    !filledTransferTuples.length &&
    !pendingTransferTuples.length &&
    !initialLoading;

  const showPendingTransactions =
    isConnected && pendingTransferTuples.length > 0;

  const {
    paginateValues,
    handlePageChange,
    handlePageSizeChange,
    currentPage,
    pageSize,
  } = filledTransfersPagination;

  return (
    <TransactionsLayout
      showNoTransactionsFound={showNoTransactionsFound}
      showPendingTransactions={showPendingTransactions}
      showFilledTransactions={isConnected}
      showLoading={initialLoading}
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
        <TransactionsTable
          title="Ongoing"
          transferTuples={pendingTransferTuples}
          enablePartialFillInfoIcon
          isMobile={isMobile}
        />
      }
      FilledTransactionsTable={
        <TransactionsTableWithPagination
          isMobile={isMobile}
          title="History"
          transferTuples={filledTransferTuples.slice(
            paginateValues.startIndex,
            paginateValues.endIndex
          )}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onPageChange={handlePageChange}
          paginateValues={paginateValues}
          currentPage={currentPage}
        />
      }
    />
  );
};

export default MyTransactions;
