import React from "react";
import styled from "@emotion/styled";
import { COLORS } from "utils";

const Layout: React.FC = ({ children }) => (
  <Wrapper>
    <Main>{children}</Main>
  </Wrapper>
);

export default Layout;

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
  overflow-y: visible;
`;
