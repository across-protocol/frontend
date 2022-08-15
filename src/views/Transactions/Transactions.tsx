import { useMemo } from "react";
import {
  Wrapper,
  Title,
  ConnectButton,
  Account,
  BottomRow,
  TopRow,
  ButtonWrapper,
  LoadingWrapper,
  NotFoundWrapper,
  EthNoteWrapper,
  TableWrapper,
} from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import createTransactionTableJSX, {
  headers,
  createPendingHeaders,
} from "./TransactionsTable/createTransactionTableJSX";

import MobileTransactionsTable from "./TransactionsTable/MobileTransactionsTable";
import createMobileTransactionTableJSX, {
  mobileHeaders,
  createPendingMobileHeaders,
} from "./TransactionsTable/createMobileTransactionTableJSX";
import { BREAKPOINTS } from "utils";
import { TransactionsTableWithPagination } from "./TransactionsTable";
import { MobileTransactionsTableWithPagination } from "./TransactionsTable";
import emptyClouds from "assets/across-emptystate-clouds.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import ethLogo from "assets/ethereum-logo.svg";
import wethLogo from "assets/weth-logo.svg";
import TransactionsTableModal from "./TransactionsTableModal";
import FillTxInfoModal from "./TransactionsTable/FillTxInfoModal";
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
    openModal,
    setOpenModal,
    modalData,
    setModalData,
    infoModalOpen,
    setInfoModalOpen,
  } = useTransactionsView();

  const ongoingTx = useMemo(
    () => createTransactionTableJSX(rawOngoingTx, setOpenModal, setModalData),
    [rawOngoingTx, setOpenModal, setModalData]
  );

  const filledTx = useMemo(
    () => createTransactionTableJSX(rawFilledTx, setOpenModal, setModalData),
    [rawFilledTx, setOpenModal, setModalData]
  );

  const mobileFilledTx = useMemo(
    () =>
      createMobileTransactionTableJSX(
        rawFilledTx,
        setOpenFilledRow,
        setOpenModal,
        setModalData
      ),
    [rawFilledTx, setOpenFilledRow, setOpenModal, setModalData]
  );

  const mobileOngoingTx = useMemo(
    () =>
      createMobileTransactionTableJSX(
        rawOngoingTx,
        setOpenOngoingRow,
        setOpenModal,
        setModalData
      ),
    [rawOngoingTx, setOpenOngoingRow, setOpenModal, setModalData]
  );

  const isTxPresent = !filledTx.length && !ongoingTx.length && !initialLoading;
  const openInfoModal = () => {
    return setInfoModalOpen(true);
  };

  return (
    <Wrapper>
      <TopRow dark={isConnected && ongoingTx.length > 0}>
        <Title>
          Transactions
          {account && (
            <Account>({shortenAddress(account, "......", 6)})</Account>
          )}
        </Title>
        {!isConnected && (
          <ButtonWrapper>
            <ConnectButton onClick={initOnboard} data-cy="connect-wallet">
              Connect Wallet
            </ConnectButton>
          </ButtonWrapper>
        )}
        {isConnected && ongoingTx.length > 0 && (
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
              {width >= BREAKPOINTS.laptopMin ? (
                <TransactionsTable
                  title="Ongoing"
                  headers={createPendingHeaders(openInfoModal, rawOngoingTx)}
                  rows={ongoingTx}
                />
              ) : (
                <MobileTransactionsTable
                  title="Ongoing"
                  headers={createPendingMobileHeaders(
                    openInfoModal,
                    rawOngoingTx
                  )}
                  rows={mobileOngoingTx}
                  openIndex={openOngoingRow}
                />
              )}
            </TableWrapper>
          </>
        )}
      </TopRow>
      {isConnected && (
        <>
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
            <TableWrapper>
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
            </TableWrapper>
          </BottomRow>
        </>
      )}
      <TransactionsTableModal
        isOpen={openModal}
        onClose={() => {
          setOpenModal(false);
          setModalData([]);
        }}
        txLinks={modalData}
      />
      <FillTxInfoModal
        isOpen={infoModalOpen}
        onClose={() => {
          setInfoModalOpen(false);
        }}
      />
    </Wrapper>
  );
};

export default Transactions;
