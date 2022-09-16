import styled from "@emotion/styled";
import Background from "assets/prelaunch-background.png";
import { QUERIES } from "utils";

export const BackgroundLayer = styled.div`
  background: url(${Background});
  background-repeat: no-repeat;
  background-size: cover;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 0 !important;
`;

export const Wrapper = styled.div`
  z-index: 1;
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  padding: 96px 0px 0px;
  gap: 64px;

  @media ${QUERIES.tabletAndDown} {
    padding-top: 48px;
  }

  min-height: calc(100vh - 72px);
  @media ${QUERIES.mobileAndDown} {
    min-height: calc(100vh - 64px);
  }

  & * {
    z-index: 1;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  justify-content: start;
  flex-direction: column;
  align-items: center;
`;
