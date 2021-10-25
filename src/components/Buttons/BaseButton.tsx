import styled from "@emotion/styled";
import { COLORS } from "utils";

export const BaseButton = styled.button`
  --radius: 30px;
  border: none;
  background: inherit;
  cursor: pointer;
  padding: 16px;
  font-size: ${16 / 16}rem;
  border-radius: var(--radius);
  &:disabled {
    cursor: not-allowed;
    opacity: 0.25;
  }
`;

export const PrimaryButton = styled(BaseButton)`
  position: relative;
  background-color: var(--color-primary);
  color: var(--color-gray);
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    border-radius: var(--radius);
    box-shadow: 0 0 16px hsla(${COLORS.primary[500]} / 0.55);
    transition: opacity 0.2s;
  }
  &:hover:not(:disabled) {
    &:after {
      opacity: 1;
    }
  }
`;
export const SecondaryButton = styled(BaseButton)`
  position: relative;
  background-color: var(--color-gray);
  color: var(--color-white);
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    border-radius: var(--radius);
    box-shadow: 0 0 16px hsla(${COLORS.gray[500]} / 0.55);
    transition: opacity 0.2s;
  }
  &:hover:not(:disabled) {
    &:after {
      opacity: 1;
    }
  }
`;
