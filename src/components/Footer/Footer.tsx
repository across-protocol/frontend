import {
  Wrapper,
  Link,
  AccentLink,
  LinksContainer,
  FooterLogo,
} from "./Footer.styles";
import { ReactComponent as DiscordLogo } from "assets/icons/discord-24.svg";
import { ReactComponent as TwitterLogo } from "assets/icons/twitter-24.svg";

export const NAV_LINKS = [
  {
    key: "faq",
    name: "FAQ",
    url: "",
    icon: "",
  },
  {
    key: "docs",
    name: "Docs",
    url: "https://docs.across.to/v2/",
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
      <LinksContainer>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.icon ? <link.icon /> : null}
            {link.name}
          </Link>
        ))}
      </LinksContainer>
      <AccentLink
        href="https://umaproject.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FooterLogo />
      </AccentLink>
    </Wrapper>
  );
};

export default Footer;
