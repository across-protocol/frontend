import { useMemo } from "react";
import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
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
      <Title>
        Transactions
        {isConnected && account && (
          <Account>({shortenAddress(account, "......", 6)})</Account>
        )}
      </Title>
      {!isConnected && (
        <ConnectButton onClick={initOnboard}>Connect Wallet</ConnectButton>
      )}
      {isConnected && (
        <>
          <TransactionsTable
            title="Ongoing"
            headers={headers}
            rows={ongoingTx}
          />
          <TransactionsTable
            title="History"
            headers={headers}
            rows={filledTx}
          />
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
