import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { COLORS, QUERIES } from "utils";

export const Overlay = styled.div`
  position: absolute;
  width: 100%;
  max-width: 1400px;
  text-align: center;
  height: 160px;
  background-color: hsla(${COLORS.gray[500]} / 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 500px;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  @media ${QUERIES.tabletAndDown} {
    top: 1110px;
  }
  @media ${QUERIES.mobileAndDown} {
    top: 1350px;
    height: 120px;
  }
`;

export const ConnectButton = styled(SecondaryButtonWithoutShadow)`
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  height: 55px;
`;
