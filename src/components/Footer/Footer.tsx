import {
  Wrapper,
  LinkFooter,
  Link,
  LogoFooter,
  LinkText,
  AccentLink,
  PoweredByUMA,
} from "./Footer.styles";
import { ReactComponent as DiscordLogo } from "assets/disc-logo.svg";
import { ReactComponent as TwitterLogo } from "assets/icon-twitter.svg";
import useWindowSize from "hooks/useWindowsSize";
const NAV_LINKS = [
  {
    key: "faq",
    name: "FAQ",
    url: "",
    icon: "",
  },
  {
    key: "docs",
    name: "Docs",
    url: "https://docs.across.to/bridge/",
    icon: "",
  },
  {
    key: "discord",
    name: "",
    url: "https://discord.gg/across",
    icon: DiscordLogo,
  },
  {
    key: "twitter",
    name: "",
    url: "https://twitter.com/AcrossProtocol",
    icon: TwitterLogo,
  },
];

const Footer = () => {
  return (
    <Wrapper>
      <LinkFooter>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.icon ? <link.icon /> : null}
            <LinkText>{link.name}</LinkText>
          </Link>
        ))}
      </LinkFooter>
      <LogoFooter>
        <AccentLink
          href="https://umaproject.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <PoweredByUMA />
        </AccentLink>
      </LogoFooter>
    </Wrapper>
  );
};

export default Footer;
