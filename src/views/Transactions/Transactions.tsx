import { useMemo } from "react";
import {
  Wrapper,
  Title,
  ConnectButton,
  Account,
  BottomRow,
  TopRow,
  TitleRow,
  ButtonWrapper,
  LoadingWrapper,
  NotFoundWrapper,
  EthNoteWrapper,
} from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import createTransactionTableJSX, {
  headers,
} from "./TransactionsTable/createTransactionTableJSX";

import MobileTransactionsTable from "./TransactionsTable/MobileTransactionsTable";
import createMobileTransactionTableJSX, {
  mobileHeaders,
} from "./TransactionsTable/createMobileTransactionTableJSX";
import { BREAKPOINTS } from "utils";
import { TransactionsTableWithPagination } from "./TransactionsTable";
import { MobileTransactionsTableWithPagination } from "./TransactionsTable";
import emptyClouds from "assets/across-emptystate-clouds.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import ethLogo from "assets/ethereum-logo.svg";
import wethLogo from "assets/weth-logo.svg";
const Transactions = () => {
  const {
    isConnected,
    initOnboard,
    account,
    width,
    openFilledRow,
    setOpenFilledRow,
    openOngoingRow,
    setOpenOngoingRow,
    currentPage,
    setCurrentPage,
    rawFilledTx,
    rawOngoingTx,
    initialLoading,
    pageSize,
    pageSizes,
    setPageSize,
  } = useTransactionsView();

  const ongoingTx = useMemo(
    () => createTransactionTableJSX(rawOngoingTx),
    [rawOngoingTx]
  );

  const filledTx = useMemo(
    () => createTransactionTableJSX(rawFilledTx),
    [rawFilledTx]
  );

  const mobileFilledTx = useMemo(
    () => createMobileTransactionTableJSX(rawFilledTx, setOpenFilledRow),
    [rawFilledTx, setOpenFilledRow]
  );

  const mobileOngoingTx = useMemo(
    () => createMobileTransactionTableJSX(rawOngoingTx, setOpenOngoingRow),
    [rawOngoingTx, setOpenOngoingRow]
  );

  const isTxPresent = !filledTx.length && !ongoingTx.length && !initialLoading;
  return (
    <Wrapper>
      {(ongoingTx.length === 0 || !isConnected) && (
        <TitleRow>
          <Title>
            Transactions
            {isConnected && account && (
              <Account>({shortenAddress(account, "......", 6)})</Account>
            )}
          </Title>
          {!isConnected && (
            <ButtonWrapper>
              <ConnectButton onClick={initOnboard}>
                Connect Wallet
              </ConnectButton>
            </ButtonWrapper>
          )}
        </TitleRow>
      )}

      {isConnected && (
        <>
          {ongoingTx.length > 0 && (
            <TopRow>
              <Title>
                Transactions
                {account && (
                  <Account>({shortenAddress(account, "......", 6)})</Account>
                )}
              </Title>
              <EthNoteWrapper>
                <img src={ethLogo} alt="ethereum_logo" />
                <img src={wethLogo} alt="weth_logo" />
                <span>
                  Note - ETH transfers will appear as WETH but you will receive
                  ETH
                </span>
              </EthNoteWrapper>
              {width >= BREAKPOINTS.laptopMin ? (
                <TransactionsTable
                  title="Ongoing"
                  headers={headers}
                  rows={ongoingTx}
                />
              ) : (
                <MobileTransactionsTable
                  title="History"
                  headers={mobileHeaders}
                  rows={mobileOngoingTx}
                  openIndex={openOngoingRow}
                />
              )}
            </TopRow>
          )}

          <BottomRow>
            {initialLoading && (
              <LoadingWrapper>
                <FontAwesomeIcon
                  icon={faCircleNotch}
                  className="fa-spin"
                  size="2x"
                />
                <div>Loading...</div>
              </LoadingWrapper>
            )}
            {isTxPresent && (
              <NotFoundWrapper>
                <img src={emptyClouds} alt="empty_state" />
                No transactions found.
              </NotFoundWrapper>
            )}
            {width >= BREAKPOINTS.laptopMin ? (
              <TransactionsTableWithPagination
                title="History"
                headers={headers}
                rows={filledTx}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                elements={filledTx}
                initialLoading={initialLoading}
                pageSize={pageSize}
                setPageSize={setPageSize}
                pageSizes={pageSizes}
              />
            ) : (
              <MobileTransactionsTableWithPagination
                title="History"
                headers={mobileHeaders}
                rows={mobileFilledTx}
                openIndex={openFilledRow}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                elements={mobileFilledTx}
                initialLoading={initialLoading}
                pageSize={pageSize}
                setPageSize={setPageSize}
                pageSizes={pageSizes}
              />
            )}
          </BottomRow>
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
