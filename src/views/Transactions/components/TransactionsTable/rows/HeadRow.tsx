import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import { TableHeadRow, HeadCell } from "../TransactionsTable.styles";

type Props = {
  isMobile?: boolean;
  showPartialFillInfoIcon?: boolean;
  onClickPartialFillInfoIcon: () => void;
};

export function HeadRow(props: Props) {
  return (
    <TableHeadRow>
      <HeadCell>Deposit time</HeadCell>
      <HeadCell>Status</HeadCell>
      <HeadCell>
        Filled %
        {props.showPartialFillInfoIcon ? (
          <FontAwesomeIcon
            style={{
              color: "#6CF9D7",
              cursor: "pointer",
            }}
            onClick={props.onClickPartialFillInfoIcon}
            icon={faCircleInfo}
          />
        ) : null}
      </HeadCell>
      {props.isMobile ? (
        <HeadCell> </HeadCell>
      ) : (
        <>
          <HeadCell>Source</HeadCell>
          <HeadCell>Destination</HeadCell>
          <HeadCell>Asset</HeadCell>
          <HeadCell>Amount</HeadCell>
          <HeadCell>Deposit tx</HeadCell>
          <HeadCell>Fill tx(s)</HeadCell>
        </>
      )}
    </TableHeadRow>
  );
}
