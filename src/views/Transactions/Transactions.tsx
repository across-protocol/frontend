import { useMemo, useState } from "react";
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
  SwitchContainer,
  SwitchButton,
  SwitchOverlay,
  TitleContainer,
} from "./Transactions.styles";
import useTransactionsView, { TableMode } from "./useTransactionsView";
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
import TransactionsTableModal from "./TransactionsTableModal";
const Transactions = () => {
  const {
    isConnected,
    initOnboard,
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
    mode,
    setMode,
    account,
    shouldRenderTable,
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
  return (
    <Wrapper>
      <TopRow dark={shouldRenderTable && ongoingTx.length > 0}>
        <TitleContainer>
          <Title>
            Transactions
            {mode !== TableMode.ALL && account && (
              <Account>({shortenAddress(account, "......", 6)})</Account>
            )}
          </Title>
          <TableSwitch mode={mode} setMode={setMode} />
        </TitleContainer>
        {!shouldRenderTable && (
          <ButtonWrapper>
            <ConnectButton onClick={initOnboard}>Connect Wallet</ConnectButton>
          </ButtonWrapper>
        )}
        {shouldRenderTable && ongoingTx.length > 0 && (
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
                  headers={headers}
                  rows={ongoingTx}
                />
              ) : (
                <MobileTransactionsTable
                  title="Ongoing"
                  headers={mobileHeaders}
                  rows={mobileOngoingTx}
                  openIndex={openOngoingRow}
                />
              )}
            </TableWrapper>
          </>
        )}
      </TopRow>
      {shouldRenderTable && (
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
    </Wrapper>
  );
};

export default Transactions;

const TableSwitch: React.FC<{
  mode: TableMode;
  setMode: (mode: TableMode) => void;
}> = ({ mode, setMode }) => {
  const [hovered, setHovered] = useState<number | undefined>(0);
  const overlayed = useMemo(() => {
    if (typeof hovered === "number") return hovered;
    if (mode === TableMode.ALL) return 1;
    return 0;
  }, [hovered, mode]);
  return (
    <SwitchContainer>
      <SwitchButton
        onMouseEnter={() => {
          setHovered(0);
        }}
        onMouseLeave={() => {
          setHovered(undefined);
        }}
        onClick={() => {
          setMode(TableMode.MY);
        }}
      >
        My Transactions
      </SwitchButton>
      <SwitchButton
        onMouseEnter={() => {
          setHovered(1);
        }}
        onMouseLeave={() => {
          setHovered(undefined);
        }}
        onClick={() => {
          setMode(TableMode.ALL);
        }}
      >
        All Transactions
      </SwitchButton>
      <SwitchOverlay position={overlayed} />
    </SwitchContainer>
  );
};
