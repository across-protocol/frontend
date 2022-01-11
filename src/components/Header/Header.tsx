import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import Wallet from "../Wallet";
import {
  Wrapper,
  Navigation,
  Link,
  LogoLink,
  Logo,
  MobileLogo,
  MobileNavigation,
  MobileList,
  MobileItem,
  BaseLink as MobileLink,
  List,
  Item,
  WalletWrapper,
} from "./Header.styles";
import MenuToggle from "./MenuToggle";
import MobileMenu from "./MobileMenu";

const LINKS = [
  { href: "/", name: "Bridge" },
  { href: "/pool", name: "Pool" },
  { href: "/about", name: "About" },
];
const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const pathname = location.pathname;
  // each time we click a link from the mobile menu, we want to close it
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    setMenuOpen((oldOpen) => !oldOpen);
  };
  return (
    <Wrapper>
      <LogoLink to="/">
        <Logo />
        <MobileLogo />
      </LogoLink>
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
      <MobileNavigation animate={isMenuOpen ? "open" : "closed"}>
        <MenuToggle toggle={toggleMenu} />
        <MobileMenu isOpen={isMenuOpen}>
          {isMenuOpen && (
            <MobileList>
              {LINKS.map(({ href, name }) => (
                <MobileItem
                  key={href}
                  aria-selected={location.pathname === href}
                >
                  <MobileLink to={href}>{name}</MobileLink>
                </MobileItem>
              ))}
            </MobileList>
          )}
        </MobileMenu>
      </MobileNavigation>
    </Wrapper>
  );
};
export default Header;
