import { FC } from "react";
import {
  TableWrapper,
  MobileTableHeadRow,
  StyledBody,
  MobileTableRow,
  MobileCell,
  MobileWrapper,
  Title,
  AccordionWrapper,
  AccordionRow,
  HeadCell,
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
  currentPage?: number;
  elementsPerPage?: number;
}

const CHEVRON_INDEX = 3;

const MobileTransactionsTable: FC<Props> = ({
  rows,
  headers,
  title,
  openIndex,
  currentPage = 0,
  elementsPerPage = 0,
}) => {
  return (
    <MobileWrapper>
      {rows.length ? (
        <>
          <Title>{title}</Title>

          <TableWrapper>
            <MobileTableHeadRow>
              {headers.map((cell, index) => {
                return <HeadCell key={index}>{cell.value}</HeadCell>;
              })}
            </MobileTableHeadRow>
            <StyledBody>
              {rows.map((row, ridx) => {
                return (
                  <>
                    <MobileTableRow key={ridx} onClick={row.onClick}>
                      {row.cells.map((cell, cidx) => {
                        return (
                          <MobileCell key={cidx}>
                            {/* ChevronDown is 4th cell of row; replace the down arrow with up if they click it */}
                            {cidx === CHEVRON_INDEX && openIndex === ridx ? (
                              <MobileChevron>
                                <FontAwesomeIcon icon={faChevronUp} />
                              </MobileChevron>
                            ) : (
                              cell.value
                            )}
                          </MobileCell>
                        );
                      })}
                    </MobileTableRow>
                    {/* Need to consider pagination for comparing these two indexes */}
                    {openIndex === ridx + currentPage * elementsPerPage && (
                      <AccordionWrapper key={ridx + 1}>
                        <AccordionRow>
                          <div>Source</div>
                          <div>{row.fromChain}</div>
                        </AccordionRow>
                        <AccordionRow>
                          <div>Destination</div>
                          <div>{row.toChain}</div>
                        </AccordionRow>
                        <AccordionRow>
                          <div>Asset</div>
                          <div>{row.symbol}</div>
                        </AccordionRow>
                        <AccordionRow>
                          <div>Amount</div>
                          <div>{row.amount}</div>
                        </AccordionRow>
                        <AccordionRow>
                          <div>Deposit tx</div>
                          <div>{row.txHash}</div>
                        </AccordionRow>
                        <AccordionRow>
                          <div>Filled tx</div>
                          <div>{row.filledTableValue}</div>
                        </AccordionRow>
                      </AccordionWrapper>
                    )}
                  </>
                );
              })}
            </StyledBody>
          </TableWrapper>
        </>
      ) : null}
    </MobileWrapper>
  );
};

export default MobileTransactionsTable;
