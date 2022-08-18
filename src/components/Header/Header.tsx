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
} from "./Header.styles";
import MenuToggle from "./MenuToggle";
import { enableMigration } from "utils";
import { ReactComponent as Logo } from "assets/across-mobile-logo.svg";
import useScrollPosition from "hooks/useScrollPosition";

const LINKS = !enableMigration
  ? [
      { href: "/", name: "Bridge" },
      { href: "/pool", name: "Pool" },
      { href: "/rewards", name: "Rewards" },
      { href: "/transactions", name: "Transactions" },
    ]
  : [];

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

// This is to check for the aria-selected below. Add any route that has a subroute to this array.
const parentRoutes = ["/rewards"];

const Header: React.FC<Props> = ({ openSidebar, setOpenSidebar }) => {
  const location = useLocation();
  const scrollPosition = useScrollPosition();

  const toggleMenu = () => {
    setOpenSidebar((prevValue) => !prevValue);
  };

  return (
    <Wrapper scrollPosition={scrollPosition}>
      <UnstyledLink
        to={{ pathname: "/", search: location.search }}
        style={{ display: "flex" }}
      >
        <Logo />
      </UnstyledLink>
      <Navigation>
        <List>
          {LINKS.map(({ href, name }) => {
            const subRoute = parentRoutes.includes(href);
            const ariaSelected =
              location.pathname === href ||
              (subRoute && location.pathname.includes(href));
            return (
              <Item key={href} aria-selected={ariaSelected}>
                <Link
                  to={{
                    pathname: href,
                    search: location.search,
                  }}
                >
                  {name}
                </Link>
              </Item>
            );
          })}
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
