import { Wrapper, Title, ConnectButton } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";

const Transactions = () => {
  const {
    provider,
    isConnected,
    initOnboard
  } = useTransactionsView()

  const handleClick = () => {
    if (!provider) {
      initOnboard();
    }
  };

  return (
    <Wrapper>
      <Title>Transactions</Title>
      {(!isConnected) && (
          <ConnectButton onClick={handleClick}>Connect Wallet</ConnectButton>
        )}
    </Wrapper>
  );
};

export default Transactions;
