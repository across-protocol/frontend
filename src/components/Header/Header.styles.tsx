import styled from "@emotion/styled";
import { Link as UnstyledLink } from "react-router-dom";
import { motion } from "framer-motion";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as UnstyledDesktopLogo } from "assets/logo.svg";
import { ReactComponent as UnstyledMobileLogo } from "assets/logo-mobile.svg";
export const Wrapper = styled.header`
  height: var(--header-height);
  padding: 0 20px;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  gap: 15px;
  align-items: center;
  background-color: var(--color-primary);
  color: var(--color-gray);
  @media ${QUERIES.tabletAndUp} {
    padding: 0 30px;
    grid-template-columns: 1fr min(100%, var(--central-content)) 1fr;
  }
`;

export const Navigation = styled.nav`
  height: 100%;
  display: none;
  @media ${QUERIES.laptopAndUp} {
    display: revert;
  }
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
  @media ${QUERIES.desktopAndUp} {
    /* padding-left: 45px; */
  }
`;
export const Logo = styled(UnstyledDesktopLogo)`
  display: none;
  @media ${QUERIES.desktopAndUp} {
    display: revert;
  }
`;

export const MobileLogo = styled(UnstyledMobileLogo)`
  @media ${QUERIES.desktopAndUp} {
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
