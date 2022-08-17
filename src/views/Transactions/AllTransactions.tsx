import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";

import ethLogo from "assets/ethereum-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import emptyClouds from "assets/across-emptystate-clouds.svg";

import { TransactionsTableWithPagination } from "./components/TransactionsTable";
import { TableSwitch } from "./components/TableSwitch";

import { useAllTransactionsView } from "./hooks/useAllTransactionsView";

import {
  Wrapper,
  Title,
  BottomRow,
  TopRow,
  LoadingWrapper,
  EthNoteWrapper,
  TableWrapper,
  NotFoundWrapper,
  TitleContainer,
} from "./Transactions.styles";
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
    <Wrapper>
      <TopRow dark={showPendingTransactions}>
        <TitleContainer>
          <Title>All Transactions</Title>
          <TableSwitch />
        </TitleContainer>
        {!isLoading && !showNoTransactionsFound && (
          <>
            <EthNoteWrapper>
              <img src={ethLogo} alt="ethereum_logo" />
              <img src={wethLogo} alt="weth_logo" />
              <span>
                Note - ETH transfers will appear as WETH but the depositor will
                receive ETH
              </span>
            </EthNoteWrapper>
            <TableWrapper>
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
              />
            </TableWrapper>
          </>
        )}
      </TopRow>
      <BottomRow>
        {isLoading ? (
          <LoadingWrapper>
            <FontAwesomeIcon
              icon={faCircleNotch}
              className="fa-spin"
              size="2x"
            />
            <div>Loading...</div>
          </LoadingWrapper>
        ) : showNoTransactionsFound ? (
          <NotFoundWrapper>
            <img src={emptyClouds} alt="empty_state" />
            No transactions found.
          </NotFoundWrapper>
        ) : (
          <TableWrapper>
            <TransactionsTableWithPagination
              isMobile={isMobile}
              title="History"
              transferTuples={getSupportedTxTuples(
                paginatedFillDeposits.transfers
              )}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={paginatedFillDeposits.handlePageChange}
              paginateValues={paginatedFillDeposits.depositsPaginateValues}
              currentPage={paginatedFillDeposits.currentPage}
            />
          </TableWrapper>
        )}
      </BottomRow>
    </Wrapper>
  );
}
