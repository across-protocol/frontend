import { useLocation } from "react-router";
import { Link as UnstyledLink } from "react-router-dom";
import Wallet from "../Wallet";
import {
  Wrapper,
  Navigation,
  Link,
  MobileNavigation,
  List,
  Item,
  WalletWrapper,
  Spacing,
  StyledLogo,
} from "./Header.styles";
import MenuToggle from "./MenuToggle";
import { enableMigration } from "utils";
import useScrollPosition from "hooks/useScrollPosition";
import { isChildPath } from "./utils";
import { useSidebarContext } from "hooks/useSidebarContext";

const LINKS = !enableMigration
  ? [
      { href: "/bridge", name: "Bridge" },
      { href: "/pool", name: "Pool" },
      { href: "/rewards", name: "Rewards" },
      { href: "/transactions", name: "Transactions" },
    ]
  : [];

interface Props {
  transparentHeader?: boolean;
}

const Header: React.FC<Props> = ({ transparentHeader }) => {
  const location = useLocation();
  const scrollPosition = useScrollPosition();
  const { isOpen, openSidebar, closeSidebar } = useSidebarContext();

  const toggleMenu = () => {
    isOpen ? closeSidebar() : openSidebar();
  };

  return (
    <Wrapper
      transparentHeader={transparentHeader}
      scrollPosition={scrollPosition}
      data-cy="primary-header"
    >
      <UnstyledLink
        to={{ pathname: "/", search: location.search }}
        style={{ display: "flex" }}
      >
        <StyledLogo />
      </UnstyledLink>
      <Navigation>
        <List>
          {LINKS.map(({ href, name }) => (
            <Item
              key={href}
              aria-selected={isChildPath(location.pathname, href)}
            >
              <Link
                to={{
                  pathname: href,
                  search: location.search,
                }}
              >
                {name}
              </Link>
            </Item>
          ))}
        </List>
      </Navigation>
      <Spacing />
      <WalletWrapper>
        <Wallet />
        <MobileNavigation animate={isOpen ? "open" : "closed"}>
          <MenuToggle toggle={toggleMenu} />
        </MobileNavigation>
      </WalletWrapper>
    </Wrapper>
  );
};

export default Header;
