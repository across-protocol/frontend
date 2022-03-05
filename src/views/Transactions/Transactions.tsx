import { Wrapper, Title, ConnectButton } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
const Transactions = () => {
  const { provider, isConnected, initOnboard } = useTransactionsView();

  const handleClick = () => {
    if (!provider) {
      initOnboard();
    }
  };

  return (
    <Wrapper>
      <Title>Transactions</Title>
      {!isConnected && (
        <ConnectButton onClick={handleClick}>Connect Wallet</ConnectButton>
      )}
      <TransactionsTable />
    </Wrapper>
  );
};

export default Transactions;
