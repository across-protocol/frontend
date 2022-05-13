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
  List,
  Item,
  WalletWrapper,
} from "./Header.styles";
import MenuToggle from "./MenuToggle";
import { showMigrationPage } from "utils";

const LINKS = !showMigrationPage
  ? [
      { href: "/", name: "Bridge" },
      { href: "/pool", name: "Pool" },
      { href: "/about", name: "About" },
    ]
  : [];

interface Props {
  openSidebar: boolean;
  setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}
const Header: React.FC<Props> = ({ openSidebar, setOpenSidebar }) => {
  const location = useLocation();

  const toggleMenu = () => {
    setOpenSidebar((prevValue) => !prevValue);
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
