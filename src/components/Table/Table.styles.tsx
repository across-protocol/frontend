import styled from "@emotion/styled";
import { CellSize } from "./Table";

const BREAKPOINTS = {
  tabletMin: 550,
  laptopMin: 1100,
  desktopMin: 1500,
};

const QUERIES = {
  tabletAndUp: `(min-width: ${BREAKPOINTS.tabletMin / 16}rem)`,
  laptopAndUp: `(min-width: ${BREAKPOINTS.laptopMin / 16}rem)`,
  desktopAndUp: `(min-width: ${BREAKPOINTS.desktopMin / 16}rem)`,
  tabletAndDown: `(max-width: ${(BREAKPOINTS.laptopMin - 1) / 16}rem)`,
};

export const TableWrapper = styled.div`
  width: 100%;
  font-size: clamp(0.75rem, 1.2vw + 0.4rem, 1.125rem);
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.4);
  @media ${QUERIES.tabletAndDown} {
    overflow: auto;
  }
`;

export const NameHeading = styled.h6`
  font-weight: bold;
  display: flex;
  align-items: baseline;
  margin: 0;
  width: fit-content;
  & > svg {
    margin-left: 5px;
    display: none;
    @media ${QUERIES.tabletAndUp} {
      display: revert;
    }
    @media ${QUERIES.laptopAndUp} {
      margin-left: 30px;
    }
  }
  & ~ span {
    font-style: italic;
    font-weight: 300;
    font-size: ${14 / 16}rem;
    display: none;
    @media ${QUERIES.tabletAndUp} {
      max-width: 45ch;
      display: block;
    }
  }
`;

export const Row = styled.div`
  width: 100%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  padding: 15px 0;
  transition: all linear 0.2s;
  &:nth-of-type(2n) {
    background-color: #ffffff;
  }
`;

export const HeadRow = styled(Row)`
  font-weight: 600;
  cursor: default;
  background: #ffffff;
  margin-bottom: 0;
`;

interface ICellStyled {
  size?: CellSize;
}

export const Cell = styled.div<ICellStyled>`
  flex: ${({ size = "sm" }) => {
    if (size === "xs") return "0 0 30px";
    if (size === "sm" || size === undefined) return "0 0 60px";
    if (size === "md") return "0 0 130px";
    if (size === "lg") return "flex: 1 2 550px";
    return "0 0 60px";
  }};
  margin: 0 8px;
  &:first-of-type {
    margin-left: 24px;
  }
  &:not(:first-of-type) {
    min-width: 150px;
  }
`;

export const Body = styled.div`
  /* padding: 15px 0; */
  background-color: var(--gray-300);
`;

export const Title = styled.h3`
  background-color: #ffffff;
  margin-bottom: 0;
  padding-top: 1rem;
  padding-left: 0.75rem;
`;
