import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { COLORS } from "utils";

export const Overlay = styled.div`
  position: absolute;
  width: 100%;
  max-width: 1406px;
  margin-top: -200px;
  left: 11%;
  text-align: center;
  height: 200px;
  background-color: hsla(${COLORS.gray[500]} / 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ConnectButton = styled(SecondaryButtonWithoutShadow)`
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  height: 55px;
`;
