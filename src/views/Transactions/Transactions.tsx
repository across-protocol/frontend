import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";

const Transactions = () => {
  const { isConnected, initOnboard, account, rows, headerCells } =
    useTransactionsView();

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
          <TransactionsTable rows={rows} headerCells={headerCells} />
        </>
      )}
    </Wrapper>
  );
};

export default Transactions;
