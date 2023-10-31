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
    fontSize: "1.125rem",
    lineHeight: "1.625rem",
    height: "4rem",
    padding: "0rem 2.5rem",
    gap: "0.25rem",
    borderRadius: "32px",
    mobileSize: "md",
  },
  md: {
    fontSize: "1rem",
    lineHeight: "1.25rem",
    height: "2.5rem",
    padding: "0rem 1.25rem",
    gap: "0.375rem",
    borderRadius: "20px",
    mobileSize: "sm",
  },
  sm: {
    fontSize: "0.875rem",
    lineHeight: "1.125rem",
    height: "2.5rem",
    padding: "0rem 1rem 0.0625rem 1rem",
    gap: "0.25rem",
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

  &:hover:not(:disabled) {
    border-color: ${({ hoveredBorderColor, borderColor = "aqua" }) =>
      COLORS[hoveredBorderColor || borderColor]};
    transition: border-color 100ms ease-out;
  }

  &:disabled {
    opacity: 0.25;
  }
`;
