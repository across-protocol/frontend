import styled from "@emotion/styled";
import { forwardRef } from "react";

import { COLORS, QUERIESV2 } from "utils";

export interface IValidInput {
  validationLevel: "valid" | "error" | "warning";
}

export const colorMap = {
  valid: {
    border: COLORS["grey-600"],
    text: COLORS["white-100"],
  },
  error: {
    border: COLORS.red,
    text: COLORS.red,
  },
  warning: {
    border: COLORS.yellow,
    text: COLORS.yellow,
  },
};

export const Input = forwardRef<
  HTMLInputElement,
  IValidInput & React.ComponentPropsWithoutRef<"input">
>(({ validationLevel, ...props }, ref) => {
  return <StyledInput ref={ref} validationLevel={validationLevel} {...props} />;
});

Input.displayName = "Input";

export function InputGroup({
  validationLevel,
  ...props
}: IValidInput & React.InputHTMLAttributes<HTMLDivElement>) {
  return <InputGroupWrapper validationLevel={validationLevel} {...props} />;
}

const StyledInput = styled.input<IValidInput>`
  font-weight: 400;
  font-size: 18px;
  font-size: 16px;
  line-height: 26px;
  color: ${({ validationLevel }) => colorMap[validationLevel].text};
  background: none;

  width: 100%;
  padding: 0;
  border: none;
  outline: 0;

  &:focus {
    outline: 0;
  }

  &::placeholder {
    color: #9daab3;
  }

  overflow-x: hidden;

  // hide number input arrows
  /* Chrome, Safari, Edge, Opera */
  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  -moz-appearance: textfield;
  appearance: textfield;
`;

const InputGroupWrapper = styled.div<IValidInput>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 9px 12px 9px 16px;
  background: #2d2e33;
  border: 1px solid ${({ validationLevel }) => colorMap[validationLevel].border};
  border-radius: 12px;
  height: 48px;
  gap: 8px;
  width: 100%;

  &:has(:focus-visible) {
    border-color: ${COLORS.aqua};
  }

  &:focus-within {
    border-color: ${COLORS.aqua};
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: 6px 12px 6px 24px;
  }
`;
