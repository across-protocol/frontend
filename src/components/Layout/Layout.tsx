import React from "react";
import styled from "@emotion/styled";

import { COLORS, QUERIES } from "utils";

import { NAV_LINKS } from "../Footer/Footer";
import { Link, AccentLink, FooterLogo } from "../Footer/Footer.styles";

const Layout: React.FC = ({ children }) => (
  <Wrapper>
    <LinkFooter>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.icon ? <link.icon /> : null}
          {link.name}
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
        <FooterLogo />
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

const Wrapper = styled.div`
  position: relative;
  display: grid;
  padding: 0 10px;
  grid-template-columns: 1fr min(var(--central-content), 100%) 1fr;
  min-height: 100vh;
`;

const Main = styled.main`
  height: 100%;
  grid-column: 2;
  box-shadow: 0 0 120px hsla(${COLORS.primary[500]} / 0.25);
  clip-path: inset(0px -160px 0px -160px);
`;
