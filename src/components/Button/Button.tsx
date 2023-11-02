import styled from "@emotion/styled";

import { QUERIESV2, COLORS } from "utils";

type ButtonSize = "lg" | "md" | "sm";
type ButtonColor = keyof typeof COLORS;

type BaseButtonProps = {
  size?: ButtonSize;
};

type PrimaryButtonProps = BaseButtonProps & {
  backgroundColor?: ButtonColor;
  textColor?: ButtonColor;
};

type SecondaryButtonProps = BaseButtonProps & {
  textColor?: ButtonColor;
  borderColor?: ButtonColor;
  hoveredBorderColor?: ButtonColor;
  backgroundColor?: ButtonColor;
};

const sizeMap: Record<
  ButtonSize,
  {
    fontSize: string;
    lineHeight: string;
    height: string;
    padding: string;
    gap: string;
    borderRadius: string;
    mobileSize: ButtonSize;
  }
> = {
  lg: {
    fontSize: "18px",
    lineHeight: "26px",
    height: "64px",
    padding: "0px 40px",
    gap: "4px",
    borderRadius: "32px",
    mobileSize: "md",
  },
  md: {
    fontSize: "16px",
    lineHeight: "20px",
    height: "40px",
    padding: "0px 20px",
    gap: "6px",
    borderRadius: "20px",
    mobileSize: "sm",
  },
  sm: {
    fontSize: "14px",
    lineHeight: "18px",
    height: "40px",
    padding: "0px 16px 1px 16px",
    gap: "4px",
    borderRadius: "20px",
    mobileSize: "sm",
  },
};

const BaseButton = styled.button<BaseButtonProps>`
  // Text styles
  font-style: normal;
  font-weight: 500;
  font-size: ${({ size = "lg" }) => sizeMap[size].fontSize};
  line-height: ${({ size = "lg" }) => sizeMap[size].lineHeight};

  // Box styles
  height: ${({ size = "lg" }) => sizeMap[size].height};
  padding: ${({ size = "lg" }) => sizeMap[size].padding};
  gap: ${({ size = "lg" }) => sizeMap[size].gap};
  border-radius: ${({ size = "lg" }) => sizeMap[size].borderRadius};

  background-color: transparent;

  &:hover:not(:disabled) {
    cursor: pointer;
  }

  &:disabled {
    cursor: not-allowed;
  }

  @media ${QUERIESV2.sm.andDown} {
    // Text styles
    font-size: ${({ size = "lg" }) =>
      sizeMap[sizeMap[size].mobileSize].fontSize};
    line-height: ${({ size = "lg" }) =>
      sizeMap[sizeMap[size].mobileSize].lineHeight};

    // Box styles
    height: ${({ size = "lg" }) => sizeMap[sizeMap[size].mobileSize].height};
    padding: ${({ size = "lg" }) => sizeMap[sizeMap[size].mobileSize].padding};
    gap: ${({ size = "lg" }) => sizeMap[sizeMap[size].mobileSize].gap};
    border-radius: ${({ size = "lg" }) =>
      sizeMap[sizeMap[size].mobileSize].borderRadius};
  }
`;

export const UnstyledButton = styled(BaseButton)`
  border: none;
  padding: 0;
  height: auto;

  @media ${QUERIESV2.sm.andDown} {
    padding: 0;
  }
`;

export const PrimaryButton = styled(BaseButton)<PrimaryButtonProps>`
  color: ${({ textColor = "black-800" }) => COLORS[textColor]};
  border: none;
  background-color: ${({ backgroundColor = "aqua" }) =>
    COLORS[backgroundColor]};

  &:hover:not(:disabled) {
    opacity: 0.75;
    transition: opacity 100ms ease-out;
  }

  &:disabled {
    opacity: 0.25;
  }
`;

export const SecondaryButton = styled(BaseButton)<SecondaryButtonProps>`
  color: ${({ borderColor = "aqua", textColor }) =>
    COLORS[textColor || borderColor]};
  border: 1px solid;
  border-color: ${({ borderColor = "aqua" }) => COLORS[borderColor]};
  background-color: ${({ backgroundColor }) =>
    backgroundColor ? COLORS[backgroundColor] : "transparent"};

  &:hover:not(:disabled) {
    border-color: ${({ hoveredBorderColor, borderColor = "aqua" }) =>
      COLORS[hoveredBorderColor || borderColor]};
    transition: border-color 100ms ease-out;
  }

  &:disabled {
    opacity: 0.25;
  }
`;
