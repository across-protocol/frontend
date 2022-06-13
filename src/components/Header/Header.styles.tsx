import styled from "@emotion/styled";
import { Link as UnstyledLink } from "react-router-dom";
import { motion } from "framer-motion";
import { QUERIES } from "utils";
import { ReactComponent as UnstyledDesktopLogo } from "assets/across-logo-v2.svg";
import { ReactComponent as UnstyledMobileLogo } from "assets/logo-mobile.svg";

export const Wrapper = styled.header`
  height: var(--header-height);
  padding: 0 20px;
  display: flex;
  gap: 15px;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-gray);
  color: var(--color-gray);
  @media ${QUERIES.laptopAndUp} {
    padding: 0 30px;
    &:first-of-type {
      flex-grow: 1;
    }
  }
`;

export const Navigation = styled.nav`
  height: 100%;
  display: none;
  flex-grow: 2;
  @media ${QUERIES.tabletAndUp} {
    display: revert;
    justify-content: space-evenly;
  }
  svg,
  path {
    line-height: 0 !important;
  }
`;

export const List = styled.ul`
  display: none;
  list-style: none;
  height: 100%;
  font-size: ${18 / 16}rem;
  max-width: 800px;
  margin: 0 auto;
  @media ${QUERIES.laptopAndUp} {
    display: flex;
  }
`;

export const Item = styled.li`
  flex: 1 0 165px;
  background-color: inherit;
  color: #c5d5e0;
  text-transform: capitalize;
  cursor: pointer;
  &[aria-selected="true"] {
    color: var(--color-primary);
    background-color: var(--color-gray);
    &::after {
      content: ".";
      color: var(--color-primary);
      display: block;
      text-align: center;
      position: absolute;
      top: 50px;
      margin-left: 96px;
      font-size: 2rem;
    }
  }
  &:hover {
    color: var(--color-primary);
  }
`;
export const BaseLink = styled(UnstyledLink)`
  display: block;
  text-decoration: none;
  color: inherit;
  outline: none;
  height: 100%;
  width: 100%;
`;

export const Link = styled(BaseLink)`
  display: grid;
  place-items: center;
`;
export const LogoLink = styled(UnstyledLink)`
  padding-left: 10px;
  line-height: 0;
  @media ${QUERIES.desktopAndUp} {
  }
`;
export const Logo = styled(UnstyledDesktopLogo)`
  display: none;
  height: 60px;
  width: 130px;
  align-self: baseline;
  @media ${QUERIES.laptopAndUp} {
    display: revert;
  }
`;

export const MobileLogo = styled(UnstyledMobileLogo)`
  @media ${QUERIES.laptopAndUp} {
    display: none;
  }
`;

export const WalletWrapper = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;
`;

export const MobileNavigation = styled(motion.nav)`
  margin-left: 16px;
`;
