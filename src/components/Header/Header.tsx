import React from "react";
import { useLocation } from "react-router";
import Wallet from "../Wallet";
import {
  Wrapper,
  Navigation,
  Link,
  Logo,
  List,
  Item,
  WalletWrapper,
} from "./Header.styles";

const LINKS = [
  { href: "/", name: "Send" },
  { href: "/pool", name: "Pool" },
  { href: "/about", name: "About" },
];
const Header: React.FC = () => {
  const location = useLocation();

  return (
    <Wrapper>
      <Logo />
      <Navigation>
        <List>
          {LINKS.map(({ href, name }) => (
            <Item key={href} aria-selected={location.pathname === href}>
              <Link to={href}>{name}</Link>
            </Item>
          ))}
        </List>
      </Navigation>
      <WalletWrapper>
        <Wallet />
      </WalletWrapper>
    </Wrapper>
  );
};
export default Header;
