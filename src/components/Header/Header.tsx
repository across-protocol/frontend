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

const LINKS = !enableMigration
  ? [
      { href: "/bridge", name: "Bridge" },
      { href: "/pool", name: "Pool" },
      { href: "/rewards", name: "Rewards" },
      { href: "/transactions", name: "Transactions" },
    ]
  : [];

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  transparentHeader?: boolean;
}

const Header: React.FC<Props> = ({
  openSidebar,
  setOpenSidebar,
  transparentHeader,
}) => {
  const location = useLocation();
  const scrollPosition = useScrollPosition();

  const toggleMenu = () => {
    setOpenSidebar((prevValue) => !prevValue);
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
        <Wallet setOpenSidebar={setOpenSidebar} />
        <MobileNavigation animate={openSidebar ? "open" : "closed"}>
          <MenuToggle toggle={toggleMenu} />
        </MobileNavigation>
      </WalletWrapper>
    </Wrapper>
  );
};

export default Header;
