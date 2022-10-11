import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

import { TableHeadRow, HeadCell } from "../TransactionsTable.styles";

type Props = {
  isMobile?: boolean;
  showPartialFillInfoIcon?: boolean;
  onClickPartialFillInfoIcon: () => void;
};

const InfoIcon = styled(FontAwesomeIcon)`
  color: #6cf9d7;
  cursor: pointer;
  margin-left: 8px;
`;

export function HeadRow(props: Props) {
  return (
    <TableHeadRow>
      <HeadCell>Deposit time</HeadCell>
      <HeadCell>Status</HeadCell>
      <HeadCell>
        Filled %
        {props.showPartialFillInfoIcon ? (
          <InfoIcon
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
