import React from "react";
import styled from "@emotion/styled";
import { COLORS } from "utils";
import { ReactComponent as UnstyledUmaLogo } from "assets/Across-Powered-UMA.svg";
import { ReactComponent as DiscordLogo } from "assets/disc-logo.svg";
import { ReactComponent as TwitterLogo } from "assets/icon-twitter.svg";

const NAV_LINKS = [
  {
    name: "FAQ",
    url: "https://across.gitbook.io/bridge/faq",
  },
  {
    name: "Docs",
    url: "https://across.gitbook.io/bridge/",
  },
];
const DISCORD_LINK = {
  name: "Discord",
  url: "https://discord.gg/across",
  logo: DiscordLogo,
};
const TWITTER_LINK = {
  name: "Twitter",
  url: "https://twitter.com/AcrossProtocol",
};

const Layout: React.FC = ({ children }) => (
  <Wrapper>
    <Footer>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.name}
        </Link>
      ))}
      <Link href={DISCORD_LINK.url} target="_blank" rel="noopener noreferrer">
        <DiscordLogo />
      </Link>
      <Link href={TWITTER_LINK.url} target="_blank" rel="noopener noreferrer">
        <TwitterLogo />
      </Link>
    </Footer>
    <Main>{children}</Main>
    <Footer>
      <AccentLink
        href="https://umaproject.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        <PoweredByUMA />
      </AccentLink>
    </Footer>
  </Wrapper>
);

export default Layout;

const Footer = styled.footer`
  padding: 0 15px 15px;
  align-self: self-end;
  &:last-of-type {
    justify-self: self-end;
  }

  &:first-of-type {
    display: flex;
    justify-self: center;
    padding-bottom: 25px;
    & svg {
      width: 25px;
      height: 25px;
      & path {
        fill: currentColor;
      }
    }
  }
`;

const Link = styled.a`
  text-decoration: none;
  transition: color 100ms linear;
  color: hsla(${COLORS.white} / 0.5);

  &:not(:last-of-type) {
    margin-right: 45px;
  }

  &:hover {
    color: var(--color-white);
  }
`;

const AccentLink = styled(Link)`
  &:hover {
    color: var(--color-uma-red);
  }
`;

const PoweredByUMA = styled(UnstyledUmaLogo)`
  fill: currentColor;

  transition: fill linear 100ms;
  & path {
    fill: currentColor;
  }
`;

const Wrapper = styled.div`
  display: grid;
  padding: 0 30px;
  grid-template-columns: 1fr var(--central-content) 1fr;
  height: 100%;
`;

const Main = styled.main`
  height: 100%;
  grid-column: 2;
  box-shadow: 0 0 120px hsla(${COLORS.primary[500]} / 0.25);
  clip-path: inset(0px -160px 0px -160px);
`;
