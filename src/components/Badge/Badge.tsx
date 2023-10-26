import styled from "@emotion/styled";

import { COLORS } from "utils";

export type BadgeColor = keyof typeof COLORS;

type BadgeProps = {
  borderColor?: BadgeColor;
  textColor?: BadgeColor;
};

export const Badge = styled.div<BadgeProps>`
  display: flex;
  height: 1.25rem;
  padding: 0.5rem 0.3125rem 0.625rem 0.3125rem;
  justify-content: center;
  align-items: center;

  letter-spacing: 0.03rem;
  font-variant-numeric: lining-nums tabular-nums;
  font-size: 0.75rem;
  line-height: normal;
  letter-spacing: 0.03rem;
  text-transform: uppercase;

  border-radius: 0.375rem;
  border: 1px solid;
  border-color: ${({ borderColor, textColor }) =>
    COLORS[borderColor || textColor || "white-100"]};
  color: ${({ borderColor, textColor }) =>
    COLORS[textColor || borderColor || "white-100"]};
`;
