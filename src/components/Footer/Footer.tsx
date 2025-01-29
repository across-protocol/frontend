import {
  Wrapper,
  Link,
  AccentLink,
  LinksContainer,
  FooterLogo,
  StyledTwitterIcon,
} from "./Footer.styles";
import { ReactComponent as DiscordLogo } from "assets/icons/discord.svg";

export const NAV_LINKS = [
  {
    key: "faq",
    name: "FAQ",
    url: "https://docs.across.to/v/user-docs/additional-info/faq",
    icon: "",
  },
  {
    key: "docs",
    name: "Docs",
    url: "https://docs.across.to/",
    icon: "",
  },
  {
    key: "discord",
    name: "",
    url: "https://discord.across.to",
    icon: DiscordLogo,
  },
  {
    key: "twitter",
    name: "",
    url: "https://twitter.com/AcrossProtocol",
    icon: StyledTwitterIcon,
  },
  {
    key: "terms_of_service",
    name: "Terms of Service",
    url: "https://across.to/terms-of-service",
    icon: undefined,
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
