import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";

import ethLogo from "assets/ethereum-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import emptyClouds from "assets/across-emptystate-clouds.svg";
import { shortenAddress } from "utils";

import {
  TransactionsTable,
  TransactionsTableWithPagination,
} from "./components/TransactionsTable";

import { useMyTransactionsView } from "./hooks/useMyTransactionsView";

import {
  Wrapper,
  Title,
  ConnectButton,
  Account,
  BottomRow,
  TopRow,
  ButtonWrapper,
  LoadingWrapper,
  EthNoteWrapper,
  TableWrapper,
  NotFoundWrapper,
  TitleContainer,
} from "./Transactions.styles";

export default function MyTransactions() {
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
    <Wrapper>
      <TopRow dark={showPendingTransactions}>
        <TitleContainer>
          <Title>
            My Transactions
            {account && (
              <Account>({shortenAddress(account, "......", 6)})</Account>
            )}
          </Title>
        </TitleContainer>
        {!isConnected && (
          <ButtonWrapper>
            <ConnectButton onClick={connectWallet} data-cy="connect-wallet">
              Connect Wallet
            </ConnectButton>
          </ButtonWrapper>
        )}
        {showPendingTransactions && (
          <>
            <EthNoteWrapper>
              <img src={ethLogo} alt="ethereum_logo" />
              <img src={wethLogo} alt="weth_logo" />
              <span>
                Note - ETH transfers will appear as WETH but you will receive
                ETH
              </span>
            </EthNoteWrapper>
            <TableWrapper>
              <TransactionsTable
                title="Ongoing"
                transferTuples={pendingTransferTuples}
                enablePartialFillInfoIcon
                isMobile={isMobile}
              />
            </TableWrapper>
          </>
        )}
      </TopRow>
      {isConnected && (
        <>
          <BottomRow>
            {initialLoading ? (
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
              </TableWrapper>
            )}
          </BottomRow>
        </>
      )}
    </Wrapper>
  );
}
