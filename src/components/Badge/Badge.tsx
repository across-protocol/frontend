import styled from "@emotion/styled";

import { COLORS } from "utils";

export type BadgeColor = keyof typeof COLORS;

type BadgeProps = {
  borderColor?: BadgeColor;
  textColor?: BadgeColor;
};

export const Badge = styled.div<BadgeProps>`
  display: flex;
  height: 20px;
  padding: 8px 5px 10px 5px;
  justify-content: center;
  align-items: center;

  font-variant-numeric: lining-nums tabular-nums;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  letter-spacing: 0.48px;
  text-transform: uppercase;

  border-radius: 6px;
  border: 1px solid;
  border-color: ${({ borderColor, textColor }) =>
    COLORS[borderColor || textColor || "white-100"]};
  color: ${({ borderColor, textColor }) =>
    COLORS[textColor || borderColor || "white-100"]};
`;
