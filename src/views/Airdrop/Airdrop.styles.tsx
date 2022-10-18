import styled from "@emotion/styled";
import { ButtonV2 } from "components";
import { QUERIESV2 } from "utils";

export const BackgroundLayer = styled.video`
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 0 !important;
  background: linear-gradient(72.13deg, #34353b 0%, rgba(52, 53, 59, 0.75) 100%),
    linear-gradient(0deg, #34353b, #34353b);
  transform: matrix(-1, 0, 0, 1, 0, 0);
  mix-blend-mode: luminosity !important;
  object-fit: cover;
`;

export const OpacityLayer = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1 !important;
  background: linear-gradient(72.13deg, #34353b 0%, rgba(52, 53, 59, 0.75) 100%),
    linear-gradient(0deg, #34353b, #34353b);
  opacity: 0.9;
`;

export const Wrapper = styled.div`
  z-index: 1;
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  padding: 96px 0px 0px;
  gap: 64px;

  @media ${QUERIESV2.tb.andDown} {
    padding-top: 48px;
  }

  min-height: calc(100vh - 72px);
  @media ${QUERIESV2.sm.andDown} {
    min-height: calc(100vh - 64px);
  }

  & * {
    z-index: 1;
  }

  a {
    :hover {
      cursor: pointer;
    }

    :visited {
      color: inherit;
    }
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  justify-content: start;
  flex-direction: column;
  align-items: center;
`;

export const Button = styled(ButtonV2)`
  @media ${QUERIESV2.sm.andDown} {
    padding: 10px 20px;
  }
`;

export const FullWidthButton = styled(Button)`
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 100%;
`;

export const InverseButton = styled(FullWidthButton)`
  border: 1px solid #6cf9d8;
  color: #6cf9d8;
  background: transparent;
`;
