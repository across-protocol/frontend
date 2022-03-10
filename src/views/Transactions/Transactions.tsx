import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import OngoingTransactionsTable from "./OngoingTransactionsTable";

const Transactions = () => {
  const { isConnected, initOnboard, account } = useTransactionsView();

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
          <OngoingTransactionsTable />
          <TransactionsTable />
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
