import { useMemo } from "react";
import { Wrapper, Title, ConnectButton, Account } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import TransactionsTable from "./TransactionsTable";
import { shortenAddress } from "utils/format";
import formatTransactionData from "./formatTransactionData";

const Transactions = () => {
  const { isConnected, initOnboard, account } = useTransactionsView();

  // Will take a Transaction Model argument
  const { ongoingTx, filledTx, headers } = useMemo(
    () => formatTransactionData(),
    []
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
