import { useMemo } from "react";
import {
  Wrapper,
  Title,
  ConnectButton,
  Account,
  BottomRow,
  TopRow,
  TitleRow,
} from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import createTransactionTableJSX from "./createTransactionTableJSX";
import { headers } from "./createTransactionTableJSX";

const Transactions = () => {
  const { isConnected, initOnboard, account, transactions } =
    useTransactionsView();

  const ongoingTx = useMemo(
    () => createTransactionTableJSX(transactions.filter((x) => x.filled < 100)),
    [transactions]
  );

  const filledTx = useMemo(
    () =>
      createTransactionTableJSX(transactions.filter((x) => x.filled >= 100)),
    [transactions]
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
            <ConnectButton onClick={initOnboard}>Connect Wallet</ConnectButton>
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
              <TransactionsTable
                title="Ongoing"
                headers={headers}
                rows={ongoingTx}
              />
            </TopRow>
          )}

          <BottomRow>
            <TransactionsTable
              title="History"
              headers={headers}
              rows={filledTx}
            />
          </BottomRow>
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
