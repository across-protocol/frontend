import { Token } from "utils";
import { TableCell, TableLogo } from "../TransactionsTable.styles";

export function SymbolCell(props: { token: Token }) {
  return (
    <TableCell>
      <TableLogo src={props.token?.logoURI} alt={`${props.token?.name}_logo`} />{" "}
      {props.token?.name === "Wrapped Ether" ? "WETH" : props.token?.symbol}
    </TableCell>
  );
}
