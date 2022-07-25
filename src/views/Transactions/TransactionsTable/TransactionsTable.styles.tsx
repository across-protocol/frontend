import styled from "@emotion/styled";
import {
  TableWrapper,
  HeadRow,
  Body,
  Row,
  Cell,
} from "components/Table/Table.styles";
import { ReactComponent as AcrossPlusIcon } from "assets/across-plus-icon.svg";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  margin: auto;
  max-width: 1425px;
  overflow-x: auto;

  ::-webkit-scrollbar {
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background-color: var(--color-gray);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-600);
  }
`;

export const Title = styled.h2`
  margin: 0 ${16 / 16}rem ${16 / 16}rem;
  color: #e0f3ff;
  font-size: ${18 / 16}rem;
  line-height: ${26 / 16}rem;
  font-weight: 400;

  @media (max-width: 428px) {
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
  }
`;

interface ITableWrapper {
  scrollable?: boolean;
}
export const StyledTableWrapper = styled(TableWrapper)<ITableWrapper>`
  border: 1px solid #3e4047;
  border-radius: 8px;
  overflow-x: ${({ scrollable }) => (scrollable ? "auto" : "hidden")};

  ::-webkit-scrollbar {
    height: 0;
  }

  ::-webkit-scrollbar-track {
    background-color: var(--color-gray);
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--color-gray-600);
    border-radius: 6px;
    border: 2px solid #2d2e33;
  }
`;

export const StyledHeadRow = styled(HeadRow)`
  display: flex;
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

export const TableCell = styled.div`
  padding: ${15 / 16}rem 0 ${15 / 16}rem ${16 / 16}rem;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #e0f3ff;
  white-space: nowrap;
  background-color: #2d2e33;
  border-top: 1px solid #3e4047;

  @media (max-width: 428px) {
    padding: ${13 / 16}rem 0 ${13 / 16}rem ${12 / 16}rem;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const HeadCell = styled(TableCell)`
  padding: ${10 / 16}rem 0 ${10 / 16}rem ${16 / 16}rem;
  color: #9daab2;
  background-color: #34353b;
  border: none;

  @media (max-width: 428px) {
    padding: ${7 / 16}rem 0 ${7 / 16}rem ${12 / 16}rem;
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

export const MobileCell = styled(StyledCell)`
  &.header-cell {
    font-weight: 500;
  }

  &:first-of-type {
    min-width: 120px;
    flex: 0 0 60px;
  }
  &:not(:first-of-type) {
    min-width: 60px;
  }

  @media ${QUERIES.mobileAndDown} {
    &.header-cell {
      font-size: ${12 / 16}rem;
    }
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
  &:nth-of-type(6) > div {
    border-bottom: none;
  }
`;

export const MobileTableLink = styled(TableLink)`
  border-bottom: none;
`;

export const PaginationWrapper = styled.div`
  max-width: 1425px;
  margin: auto;

  @media ${QUERIES.mobileAndDown} {
    padding: 0 ${20 / 16}rem;
  }
`;

export const StyledPlus = styled(AcrossPlusIcon)`
  cursor: pointer;
  float: right;
  margin-top: 8px;
  margin-right: 4px;
`;
