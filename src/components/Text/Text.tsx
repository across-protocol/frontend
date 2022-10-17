import styled from "@emotion/styled";

import { QUERIESV2 } from "utils";

type TextSize = "4xl" | "3xl" | "2xl" | "xl" | "lg" | "md" | "sm" | "xs";

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

type TextColor = "white-100" | "white-88";

const colorMap: Record<TextColor, string> = {
  "white-100": "#E0F3FF",
  "white-88": "#C5D5E0",
};

type TextProps = {
  size?: TextSize;
  weight?: number;
  color?: string;
};

export const Text = styled.p<TextProps>`
  font-style: normal;
  font-weight: ${({ weight = 400 }) => weight};
  color: ${({ color = "white-88" }) => colorMap[color as TextColor] || color};

  font-size: ${({ size = "md" }) => `${sizeMap[size].fontSize / 16}rem`};
  line-height: ${({ size = "md" }) =>
    `${sizeMap[size || "md"].lineHeight / 16}rem`};

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${({ size = "md" }) =>
      `${sizeMap[sizeMap[size].mobileSize].fontSize / 16}rem`};
    line-height: ${({ size = "md" }) =>
      `${sizeMap[sizeMap[size].mobileSize].lineHeight / 16}rem`};
  }
`;
