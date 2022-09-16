import styled from "@emotion/styled";
import Background from "assets/prelaunch-background.png";
import { QUERIES } from "utils";

export const BackgroundLayer = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 0 !important;
  background: linear-gradient(72.13deg, #34353b 0%, rgba(52, 53, 59, 0.75) 100%),
    url(${Background}), #34353b;
  background-blend-mode: normal, luminosity, normal;
  transform: matrix(-1, 0, 0, 1, 0, 0);
`;

export const Wrapper = styled.div`
  z-index: 1;
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  padding: 96px 0px 0px;
  gap: 64px;

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
