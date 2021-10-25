import styled from "@emotion/styled";
import { Link as UnstyledLink } from "react-router-dom";
import { COLORS } from "utils";
import { ReactComponent as UnstyledLogo } from "assets/logo.svg";

export const Wrapper = styled.header`
  height: 100px;
  padding: 0 30px;
  display: grid;
  grid-template-columns: 1fr var(--central-content) 1fr;
  gap: 15px;
  align-items: center;
  background-color: var(--color-primary);
  color: var(--color-gray);
`;

export const Navigation = styled.nav`
  height: 100%;
`;

export const List = styled.ul`
  display: flex;
  list-style: none;
  height: 100%;
  font-size: ${18 / 16}rem;
`;

export const Item = styled.li`
  flex: 1 0 165px;
  background-color: inherit;
  color: var(--color-gray);
  text-transform: capitalize;
  cursor: pointer;
  &[aria-selected="true"] {
    color: var(--color-white);
    background-color: var(--color-gray);
    font-weight: bold;
  }
  &:hover:not([aria-selected="true"]) {
    color: hsla(${COLORS.gray[500]} / 0.5);
  }
`;

export const Link = styled(UnstyledLink)`
  text-decoration: none;
  color: inherit;
  height: 100%;
  width: 100%;
  display: grid;
  place-items: center;
`;

export const Logo = styled(UnstyledLogo)`
  padding-left: 40px;
`;

export const WalletWrapper = styled.div`
  justify-self: flex-end;
`;
