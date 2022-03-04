import { Wrapper, Title, ConnectButton } from "./Transactions.styles";
import useTransactionsView from "./useTransactionsView";
import Table, { ICell, IRow } from "components/Table/Table";

const hc: ICell[] = [
  {
    size: "sm",
    value: "Deposit time",
  },
  {
    size: "sm",
    value: "Status",
  },
  {
    size: "sm",
    value: "Filled %",
  },
  {
    size: "sm",
    value: "Source",
  },
  {
    size: "sm",
    value: "Destination",
  },
  {
    size: "sm",
    value: "Asset",
  },
  {
    size: "sm",
    value: "Amount",
  },
  {
    size: "sm",
    value: "Deposit tx",
  },
];

const rows: IRow[] = [
  {
    cells: [
      {
        size: "sm",
        value: "Feb 5th",
      },
      {
        size: "sm",
        value: "Filled",
      },
      {
        size: "sm",
        value: "100%",
      },
      {
        size: "sm",
        value: "Arbitrum",
      },
      {
        size: "sm",
        value: "Ethereum",
      },
      {
        size: "sm",
        value: "UMA",
      },
      {
        size: "sm",
        value: "5000",
      },
      {
        size: "sm",
        value: "0x123...",
      },
    ],
  },
];

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
      <Table headerCells={hc} rows={rows} />
    </Wrapper>
  );
};

export default Transactions;
