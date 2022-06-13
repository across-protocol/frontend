import styled from "@emotion/styled";
import { QUERIES } from "utils";
import { RoundBox } from "../Box";
import { SecondaryButton } from "../Buttons";
import { ReactComponent as LgLogo } from "assets/lg-across-logo.svg";

export const Wrapper = styled(RoundBox)`
  background-color: inherit;
  width: 100%;
  padding: 0;
  display: none;

  &:hover {
    cursor: pointer;
  }
  @media ${QUERIES.laptopAndUp} {
    display: grid;
  }
`;

export const ConnectButton = styled(SecondaryButton)`
  padding: 12px 16px;
  border: 1px solid var(--color-primary);
  background-color: var(--color-gray);
  color: var(--color-primary);
`;

export const Account = styled.div`
  background-color: var(--color-gray);
  color: var(--color-white);
  display: grid;
  place-items: center;
  padding: 0 10px;
  border-radius: 0 var(--radius) var(--radius) 0;
  border: 1px solid var(--color-gray);
  @media ${QUERIES.tabletAndUp} {
    padding: 0 30px;
  }
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-transform: capitalize;
  border-radius: var(--radius) 0 0 var(--radius);
  border: 1px solid var(--color-gray);
  padding: 5px 10px;
  white-space: nowrap;
  & > div {
    line-height: 1;
  }
  & > div:last-of-type {
    color: var(--color-gray-300);
    font-size: ${14 / 16}rem;
  }
  @media ${QUERIES.tabletAndUp} {
    padding: 10px 20px 5px;
  }
`;

export const UnsupportedNetwork = styled.div`
  background-color: rgba(45, 46, 51, 0.25);
  padding: 1rem 0.5rem;
`;

export const BalanceButton = styled(SecondaryButton)`
  width: 175px;
  border: 1px solid #4d4f56;
  display: flex;
  align-content: center;
`;

export const Logo = styled(LgLogo)`
  height: 20px;
  width: 20px;
  margin-right: 4px;
`;
