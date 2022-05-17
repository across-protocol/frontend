import styled from "@emotion/styled";
import {
  TableWrapper,
  HeadRow,
  Body,
  Row,
  Cell,
} from "components/Table/Table.styles";
import { ReactComponent as AcrossPlusIcon } from "assets/across-plus-icon.svg";

export const Wrapper = styled.div`
  margin: 2rem auto;
  max-width: 1425px;
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
  width: 1425px;
  overflow-x: auto;
`;

export const StyledBody = styled(Body)``;

export const StyledRow = styled(Row)`
  background: rgba(255, 255, 255, 0.08);
  width: 1425px;
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
  word-wrap: break-word;
  &:first-of-type {
    min-width: 175px;
    flex: 0 0 65px;
  }
  &:not(:first-of-type) {
    min-width: 120px;
  }
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
  width: 100%;
  min-width: 300px;
`;

export const StyledMobileHeadRow = styled(StyledHeadRow)`
  width: 100%;
`;

export const StyledMobileRow = styled(StyledRow)`
  width: 100%;
  cursor: pointer;
  &:first-of-type {
    margin-bottom: 0px;
  }
  &:not(:first-of-type) {
    margin: 1px 0;
  }
`;

export const MobileCell = styled(StyledCell)`
  &.header-cell {
    font-size: ${16 / 16}rem;
    font-weight: 500;
  }

  &:first-of-type {
    min-width: 120px;
    flex: 0 0 60px;
  }
  &:not(:first-of-type) {
    min-width: 60px;
  }
`;

export const MobileChevron = styled.div`
  text-align: right;
  margin-right: 24px;
  cursor: pointer;
  svg {
    color: var(--color-primary);
  }
`;

export const AccordionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const AccordionRow = styled.div`
  display: flex;
  > div {
    padding: 8px 0;
  }
  &:first-of-type {
    div:first-of-type {
      border-top: 1px solid #2c2f33;
    }
    div:nth-of-type(2) {
      border-top: 1px solid #2c2f33;
    }
  }
  > div:first-of-type {
    flex: 1 0 60px;
    background-color: var(--color-black);
    border-bottom: 1px solid #2c2f33;
    text-indent: 24px;
  }
  > div:nth-of-type(2) {
    flex: 3 0 130px;
    background: rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid #2c2f33;
    text-indent: 12px;
  }
  &:nth-of-type(5) > div {
    border-bottom: none;
  }
`;

export const MobileTableLink = styled(TableLink)`
  border-bottom: none;
`;

export const PaginationWrapper = styled.div`
  max-width: 1200px;
  margin: auto;
`;

export const StyledPlus = styled(AcrossPlusIcon)`
  cursor: pointer;
  float: right;
  margin-top: 8px;
  margin-right: 4px;
`;
