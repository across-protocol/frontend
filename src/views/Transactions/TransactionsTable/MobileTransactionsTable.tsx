import { FC } from "react";
import {
  StyledTableWrapper,
  StyledMobileHeadRow,
  StyledBody,
  StyledMobileRow,
  MobileCell,
  MobileWrapper,
  Title,
} from "./TransactionsTable.styles";
import { ICell } from "components/Table/Table";
import { IMobileRow } from "./createMobileTransactionTableJSX";
import { MobileChevron } from "./TransactionsTable.styles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface Props {
  rows: IMobileRow[];
  headers: ICell[];
  title: string;
  openIndex: number;
}

const MobileTransactionsTable: FC<Props> = ({
  rows,
  headers,
  title,
  openIndex,
}) => {
  return (
    <MobileWrapper>
      <Title>{title}</Title>
      <StyledTableWrapper>
        <StyledMobileHeadRow>
          {headers.map((cell, index) => {
            return (
              <MobileCell
                key={index}
                className={cell.cellClassName ?? ""}
                size={cell.size}
              >
                {cell.value}
              </MobileCell>
            );
          })}
        </StyledMobileHeadRow>
        <StyledBody>
          {rows.map((row, ridx) => {
            return (
              <>
                <StyledMobileRow key={ridx} onClick={row.onClick}>
                  {row.cells.map((cell, cidx) => {
                    return (
                      <MobileCell
                        className={cell.cellClassName ?? ""}
                        key={cidx}
                        size={cell.size}
                      >
                        {cidx === 3 && openIndex === ridx ? (
                          <MobileChevron>
                            <FontAwesomeIcon icon={faChevronUp} />
                          </MobileChevron>
                        ) : (
                          cell.value
                        )}
                      </MobileCell>
                    );
                  })}
                </StyledMobileRow>
                {openIndex === ridx && (
                  <div key={openIndex}>
                    <ul>
                      <li>{row.fromChain}</li>
                      <li>{row.toChain}</li>
                      <li>{row.symbol}</li>
                      <li>{row.amount}</li>
                      <li>{row.txHash}</li>
                    </ul>
                  </div>
                )}
              </>
            );
          })}
        </StyledBody>
      </StyledTableWrapper>
    </MobileWrapper>
  );
};

export default MobileTransactionsTable;
