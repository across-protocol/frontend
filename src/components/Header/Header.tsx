import React from "react";
import styled from "@emotion/styled";
import { Link as UnstyledLink, useLocation } from "react-router-dom";

import { ReactComponent as Logo } from "../../assets/logo.svg";
import Wallet from "../Wallet";

const LINKS = [
  { href: "/", name: "Send" },
  { href: "/pool", name: "Pool" },
  { href: "/about", name: "About" },
];

const Header: React.FC = () => {
  const location = useLocation();
  console.log(location);
  return (
    <Wrapper>
      <LogoWrapper>
        <Logo />
      </LogoWrapper>
      <NavigationWrapper>
        <Navigation>
          {LINKS.map(({ href, name }) => (
            <li key={name}>
              <Link to={href} isSelected={href === location.pathname}>
                {name}
              </Link>
            </li>
          ))}
        </Navigation>
      </NavigationWrapper>

      <Wallet />
    </Wrapper>
  );
};
export default Header;

const Wrapper = styled.header`
  padding: 0 30px;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100px;
`;

const LogoWrapper = styled.div`
  padding-left: 40px;
`;
const NavigationWrapper = styled.nav`
  height: 100%;
`;
const Navigation = styled.ul`
  height: 100%;
  display: flex;
  align-items: stretch;
`;

const Link = styled(UnstyledLink)<{ isSelected: boolean }>`
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 165px;
  height: 100%;
  font-size: ${22 / 16}rem;
  background-color: ${(p) => (p.isSelected ? "var(--gray)" : "inherit")};
  color: ${(p) => (p.isSelected ? "var(--white)" : "inherit")};
  cursor: ${(p) => (p.isSelected ? "default" : "pointer")};

  transition: color 100ms linear, background-color 100ms linear;
  &:hover {
    color: var(--white-transparent);
    background-color: var(--gray);
  }
`;
