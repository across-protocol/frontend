import { ChainId, getChainInfo } from "utils";
import { TableCell, TableLogo } from "../TransactionsTable.styles";

export function ChainCell(props: { chainId: ChainId }) {
  const chainInfo = getChainInfo(props.chainId);
  const { name, logoURI } = chainInfo;

  return (
    <TableCell>
      <TableLogo src={logoURI} alt={`${name}_logo`} /> {name}
    </TableCell>
  );
}
