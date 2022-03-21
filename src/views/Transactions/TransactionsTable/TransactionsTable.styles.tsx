import styled from "@emotion/styled";
import {
  TableWrapper,
  HeadRow,
  Body,
  Row,
  Cell,
} from "components/Table/Table.styles";

export const Wrapper = styled.div`
  margin: 2rem auto;
  max-width: 1900px;
  overflow-x: auto;
`;

export const Title = styled.h2`
  color: var(--color-white);
  font-size: ${20 / 16}rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const StyledTableWrapper = styled(TableWrapper)`
  background-color: inherit;
  margin: 0 auto;
  box-shadow: none;
`;

export const StyledHeadRow = styled(HeadRow)`
  background-color: var(--color-black);
  width: 1900px;
  overflow-x: auto;
`;

export const StyledBody = styled(Body)``;

export const StyledRow = styled(Row)`
  background: rgba(255, 255, 255, 0.08);
  width: 1900px;
  overflow-x: auto;
  margin: 0 auto;
  /* Don't do zebra */
  &:first-of-type {
    margin-bottom: 2px;
  }
  &:not(:first-of-type) {
    margin: 2px 0;
  }
  &:nth-of-type(2n) {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

export const StyledCell = styled(Cell)`
  &.header-cell {
    font-size: ${16 / 16}rem;
    font-weight: 500;
  }
`;

export const TableLogo = styled.img`
  height: 15px;
  margin-right: 4px;
`;

export const TableLink = styled.a`
  color: var(--color-primary);
  &:hover {
    opacity: 0.7;
  }
`;

export const MobileWrapper = styled(Wrapper)`
  max-width: 100%;
  width: 100%;
`;

export const StyledMobileHeadRow = styled(StyledHeadRow)`
  width: 100%;
`;

export const StyledMobileRow = styled(StyledRow)`
  width: 100%;
`;
