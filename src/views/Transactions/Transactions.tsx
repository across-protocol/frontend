import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddressLong } from "utils/format";

const Transactions = () => {
  const { provider, isConnected, initOnboard, account } = useTransactionsView();

  const handleClick = () => {
    if (!provider) {
      initOnboard();
    }
  };

  return (
    <Wrapper>
      <Title>
        Transactions
        {isConnected && account && (
          <Account>({shortenAddressLong(account, 6)})</Account>
        )}
      </Title>
      {!isConnected && (
        <ConnectButton onClick={handleClick}>Connect Wallet</ConnectButton>
      )}
      {isConnected && (
        <>
          <TransactionsTable />
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
