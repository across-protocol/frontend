import React from "react";
import styled from "@emotion/styled";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as UnstyledUmaLogo } from "assets/Across-Powered-UMA.svg";
import { ReactComponent as SupportLogo } from "assets/support-logo.svg";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { ReactComponent as DocsLogo } from "assets/docs-logo.svg";
import { ReactComponent as MediumLogo } from "assets/Across-Medium-white.svg";
import { ReactComponent as DiscourseLogo } from "assets/Across-Discourse-white.svg";

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
  {
    name: "Medium",
    url: "https://medium.com/across-protocol",
    icon: MediumLogo,
    className: "nav-link",
  },
  {
    name: "Discourse",
    url: "https://forum.across.to",
    icon: DiscourseLogo,
    className: "nav-link",
  },
];

const Layout: React.FC = ({ children }) => (
  <Wrapper>
    <LinkFooter>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={link.className ?? ""}
        >
          <link.icon />
          <LinkText>{link.name}</LinkText>
        </Link>
      ))}
    </LinkFooter>
    <Main>{children}</Main>
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

export default Layout;

const BaseFooter = styled.footer`
  position: sticky;
  bottom: 0;
  padding: 0 15px 15px;
  align-self: self-end;
  justify-self: center;
  @media ${QUERIES.laptopAndUp} {
    justify-self: start;
  }
`;

const LinkFooter = styled(BaseFooter)`
  display: none;
  align-items: center;
  & svg {
    width: 25px;
    height: 25px;
  }
  @media ${QUERIES.laptopAndUp} {
    display: flex;
  }
`;

const LogoFooter = styled(BaseFooter)`
  position: absolute;
  right: 10px;
  @media ${QUERIES.tabletAndUp} {
    position: sticky;
    right: revert;
    margin-left: auto;
  }
`;

const Link = styled.a`
  text-decoration: none;
  transition: color 100ms linear;
  color: hsla(${COLORS.white} / 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: ${14 / 16}rem;
  opacity: 0.75;

  &:not(:last-of-type) {
    margin-right: 45px;
  }

  &:hover {
    color: var(--color-white);
    opacity: 1;
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
  position: relative;
  display: grid;
  padding: 0 10px;
  grid-template-columns: 1fr min(var(--central-content), 100%) 1fr;
  min-height: 100%;
  height: fit-content;
  @media ${QUERIES.tabletAndUp} {
    padding: 0 30px;
  }
`;

const Main = styled.main`
  height: 100%;
  grid-column: 2;
  box-shadow: 0 0 120px hsla(${COLORS.primary[500]} / 0.25);
  clip-path: inset(0px -160px 0px -160px);
`;

const LinkText = styled.div`
  color: #ffffff;
`;
