import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import useTransactionTableValues from "./useTransactionTableValues";

const Transactions = () => {
  const { isConnected, initOnboard, account } = useTransactionsView();
  const { ongoingRows, filledRows, headers } = useTransactionTableValues();

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
            rows={ongoingRows}
          />
          <TransactionsTable
            title="History"
            headers={headers}
            rows={filledRows}
          />
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
