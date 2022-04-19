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
            {width >= BREAKPOINTS.laptopMin ? (
              <TransactionsTableWithPagination
                title="History"
                headers={headers}
                rows={filledTx}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                elements={filledTx}
                initialLoading={initialLoading}
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
              />
            )}
          </BottomRow>
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
