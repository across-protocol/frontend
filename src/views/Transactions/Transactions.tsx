import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import formatTransactions from "./formatTransactions";

const Transactions = () => {
  const { isConnected, initOnboard, account } = useTransactionsView();
  const { rows, headers } = formatTransactions();

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
          <TransactionsTable rows={rows} headers={headers} />
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
