import styled from "@emotion/styled";

import { QUERIESV2, COLORS } from "utils";

type TextSize =
  | "4xl"
  | "3.5xl"
  | "3xl"
  | "2xl"
  | "xl"
  | "lg"
  | "md"
  | "sm"
  | "xs";

type TextCasing = "uppercase" | "lowercase" | "capitalize" | "normal";

const sizeMap: Record<
  TextSize,
  {
    fontSize: number;
    lineHeight: number;
    mobileSize: TextSize;
  }
> = {
  "4xl": {
    fontSize: 48,
    lineHeight: 58,
    mobileSize: "3xl",
  },
  "3.5xl": {
    fontSize: 40,
    lineHeight: 48,
    mobileSize: "3xl",
  },
  "3xl": {
    fontSize: 32,
    lineHeight: 38,
    mobileSize: "2xl",
  },
  "2xl": {
    fontSize: 26,
    lineHeight: 31,
    mobileSize: "xl",
  },
  xl: {
    fontSize: 22,
    lineHeight: 26,
    mobileSize: "lg",
  },
  lg: {
    fontSize: 18,
    lineHeight: 26,
    mobileSize: "md",
  },
  md: {
    fontSize: 16,
    lineHeight: 20,
    mobileSize: "sm",
  },
  sm: {
    fontSize: 14,
    lineHeight: 18,
    mobileSize: "xs",
  },
  xs: {
    fontSize: 12,
    lineHeight: 14,
    mobileSize: "xs",
  },
};

export type TextColor = keyof typeof COLORS;

type TextProps = {
  size?: TextSize;
  weight?: number;
  color?: TextColor;
  casing?: TextCasing;
};

export const Text = styled.div<TextProps>`
  font-style: normal;
  font-weight: ${({ weight = 400 }) => weight};
  color: ${({ color = "white-88" }) => COLORS[color]};

  font-size: ${({ size = "md" }) => `${sizeMap[size].fontSize / 16}rem`};
  line-height: ${({ size = "md" }) =>
    `${sizeMap[size || "md"].lineHeight / 16}rem`};

  text-transform: ${({ casing = "normal" }) =>
    casing === "normal" ? "none" : casing};

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${({ size = "md" }) =>
      `${sizeMap[sizeMap[size].mobileSize].fontSize / 16}rem`};
    line-height: ${({ size = "md" }) =>
      `${sizeMap[sizeMap[size].mobileSize].lineHeight / 16}rem`};
  }
`;
