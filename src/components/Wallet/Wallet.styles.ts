import styled from "@emotion/styled";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as AcrossLogo } from "assets/across-mobile-logo.svg";

export const WalletWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: baseline;

  gap: 16px;

  @media (max-width: 428px) {
    gap: 8px;
  }
`;

export const ConnectButton = styled.button`
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  padding: 9px 20px;
  font-weight: 500;
  border: 1px solid var(--color-primary);
  border-radius: 32px;
  background-color: #2d2e33;
  color: #6cf9d8;
  cursor: pointer;
  transition: opacity 0.1s;

  :hover {
    opacity: 0.8;
  }

  @media (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
    padding: 10px 16px;
  }
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-transform: capitalize;
  border-radius: var(--radius) 0 0 var(--radius);
  border: 1px solid var(--color-primary);
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

export const BalanceButton = styled.button`
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  font-size: 16px;
  line-height: 20px;
  color: #9daab2;
  font-weight: 500;
  border: 1px solid #4d4f56;
  border-radius: 32px;
  background-color: transparent;
  outline: none;
  cursor: pointer;

  :hover {
    color: #e0f3ff;
    border: 1px solid #e0f3ff;
  }

  @media (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const SubscribeButton = styled(BalanceButton)`
  border-color: ${COLORS["aqua"]};
  color: ${COLORS["aqua"]};
`;

export const BalanceWallet = styled.div`
  font: inherit;
  padding-right: 12px;
  color: #e0f3ff;

  @media (max-width: 428px) {
    display: none;
  }
`;

export const Separator = styled.div`
  height: 16px;
  width: 1px;
  margin-right: 12px;
  background-color: #4d4f56;

  @media (max-width: 428px) {
    display: none;
  }
`;

export const Logo = styled(AcrossLogo)`
  height: 16px;
  width: 16px;
  margin-right: 6px;

  @media (max-width: 428px) {
    display: none;
  }
`;

export const Account = styled.div`
  font: inherit;
  /* border: 1px solid var(--color-gray); */
`;
