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
import { enableMigration } from "utils";

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
