import styled from "@emotion/styled";
import { CellSize } from "./Table";
import { QUERIES } from "utils";

export const TableWrapper = styled.div`
  width: 100%;
  font-size: 16px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.4);
  @media ${QUERIES.tabletAndDown} {
    overflow: auto;
  }

  @media ${QUERIES.mobileAndDown} {
    font-size: 12px;
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
  background-color: var(--color-gray-150);
  display: flex;
  align-items: center;
  padding: 15px 0;
  transition: all linear 0.2s;
  &:nth-of-type(2n) {
    background-color: var(--color-white);
  }

  @media ${QUERIES.mobileAndDown} {
    padding: 11px 0;
  }
`;

export const HeadRow = styled(Row)`
  font-weight: 600;
  cursor: default;
  background: var(--color-white);
  margin-bottom: 0;

  @media ${QUERIES.mobileAndDown} {
    padding: 6px 0;
  }
`;

interface ICellStyled {
  size?: CellSize;
}

export const Cell = styled.div<ICellStyled>`
  flex: ${({ size = "sm" }) => {
    if (size === "xs") return "0 0 30px";
    if (size === "md") return "1 0 130px";
    if (size === "lg") return "1 1 250px";
    if (size === "sm" || size === undefined) return "1 0 60px";
    return "1 0 60px";
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
  background-color: var(--gray-300);
`;

export const Title = styled.h3`
  background-color: var(--color-white);
  margin-bottom: 0;
  padding-top: 1rem;
  padding-left: 0.75rem;
`;
