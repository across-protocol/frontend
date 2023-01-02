import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";

interface Input {
  valid: boolean;
  invalid: boolean;
}
export const InputWrapper = styled.div<Input>`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  background: #2d2e33;
  border-radius: 32px;

  height: 64px;

  padding: 0px 24px;

  border: 1px solid
    ${({ valid, invalid }) =>
      !valid && !invalid ? "#4c4e57" : invalid ? "#f96c6c" : "#e0f3ff"};
  @media ${QUERIESV2.sm.andDown} {
    padding: 0px 12px;
    height: 48px;
  }
`;

export const Input = styled.input<Input>`
  background: transparent;
  color: ${({ valid, invalid }) =>
    !invalid && !valid ? "#9daab2" : invalid ? "#f96c6c" : "#e0f3ff"};
  font-size: 16px;
  border: none;
  width: 100%;
  padding: 0;

  &:focus {
    outline: 0;
  }
  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
  }
`;

export const MaxButton = styled(UnstyledButton)`
  font-size: 12px;
  line-height: 14px;

  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c5d5e0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border: 1px solid #4c4e57;
  border-radius: 24px;
  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;
  }

  padding: 8px 16px;
  @media ${QUERIESV2.sm.andDown} {
    height: 24px;
    padding: 0px 10px;
  }
`;

export const TokenIcon = styled.img`
  height: 24px;
  width: 24px;
`;
