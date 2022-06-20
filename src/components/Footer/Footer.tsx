import {
  Wrapper,
  LinkFooter,
  Link,
  LogoFooter,
  LinkText,
  AccentLink,
  PoweredByUMA,
} from "./Footer.styles";
import { ReactComponent as SupportLogo } from "assets/support-logo.svg";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { ReactComponent as DocsLogo } from "assets/docs-logo.svg";

const NAV_LINKS = [
  {
    name: "Docs",
    url: "https://docs.across.to/bridge/",
    icon: DocsLogo,
  },
  {
    name: "Support",
    url: "https://discord.gg/across",
    icon: SupportLogo,
  },
  {
    name: "Github",
    url: "https://github.com/across-protocol",
    icon: GithubLogo,
  },
];

const Footer = () => {
  return (
    <Wrapper>
      <LinkFooter>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <link.icon />
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
