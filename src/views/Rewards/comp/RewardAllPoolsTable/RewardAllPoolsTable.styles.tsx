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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { ReactComponent as WethLogo } from "assets/weth-logo.svg";

export const Wrapper = styled.div`
  margin: auto;
  max-width: 1425px;
  overflow-x: auto;
  box-shadow: inset 0px -1px 0px #3e4047;
  border-radius: 5px;
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
  color: var(--color-white);
  font-size: ${20 / 16}rem;
  font-weight: 600;
  margin-bottom: 1rem;

  @media ${QUERIES.mobileAndDown} {
    padding: 0 ${20 / 16}rem;
    font-weight: 600;
    font-size: ${13 / 16}rem;
    line-height: ${16 / 16}rem;
    text-transform: uppercase;
  }
`;

export const StyledTableWrapper = styled(TableWrapper)`
  background-color: inherit;
  margin: 0 auto;
  box-shadow: none;
`;

export const StyledHeadRow = styled(HeadRow)`
  background-color: #34353b;
  width: 1425px;
  overflow-x: auto;
`;

export const StyledBody = styled(Body)`
  column-gap: 15px;
`;

export const StyledRow = styled(Row)`
  background-color: #2d2e33;
  width: 1425px;
  overflow-x: auto;
  margin: 0 auto;
  border: 0;

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
  flex: 1 0 65px;
  background-color: #2d2e33;
  &:first-of-type {
    /* min-width: 175px; */
    /* flex: 0 0 65px; */
  }
  &:not(:first-of-type) {
    min-width: 120px;
  }
  &.header-cell {
    font-size: ${16 / 16}rem;
    font-weight: 500;
    color: #9daab2;
    background-color: #34353b;
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

const StyledCircleInfo = styled(FontAwesomeIcon)`
  path {
    fill: #9daab2;
  }
  margin-left: 4px;
  border: 1px solid #9daab2;
  border-radius: 16px;
`;

export const CircleInfo = () => (
  <StyledCircleInfo icon={faCircleInfo} style={{ color: "white" }} />
);

export const StyledWETHIcon = styled(WethLogo)`
  height: 24px;
  width: 24px;
`;

export const PoolCellValue = styled.div`
  font-weight: bold;
  display: flex;
  column-gap: 16px;
  align-items: center;
  div {
    font-size: 1rem;
    font-weight: 500;
    color: #e0f3ff;
  }
`;

export const MultiplierCellValue = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: 16px;
`;

export const MutliplierValue = styled.div`
  font-weight: 500;
  font-size: 1rem;
`;
