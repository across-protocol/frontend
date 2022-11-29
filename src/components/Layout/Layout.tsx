import React from "react";
import styled from "@emotion/styled";

import { COLORS } from "utils";

import Footer from "../Footer/Footer";

const Layout: React.FC = ({ children }) => (
  <>
    <Wrapper>
      <Main>{children}</Main>
    </Wrapper>
    <FooterWrapper>
      <Footer />
    </FooterWrapper>
  </>
);

export default Layout;

const FooterWrapper = styled.div`
  margin-top: -74px;
`;

const Wrapper = styled.div`
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
