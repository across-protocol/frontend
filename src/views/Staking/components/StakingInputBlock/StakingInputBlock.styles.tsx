import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import { PrimaryButton, UnstyledButton } from "components/Button";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const InputRow = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  align-items: center;

  & svg {
    height: 24px;
    width: 24px;
    flex-shrink: 0;
  }

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: column;
    gap: 12px;
  }
`;
interface IStakeInput {
  valid: boolean;
  invalid: boolean;
}
export const InputWrapper = styled.div<IStakeInput>`
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

export const Input = styled.input<IStakeInput>`
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

  &::placeholder {
    color: #9daab3;
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

export const ButtonWrapper = styled.div`
  flex-grow: 1;
  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
`;

export const StakeButton = styled(PrimaryButton)`
  text-transform: capitalize;
`;

export const StakeButtonContentWrapper = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-direction: row;
`;

export const LoaderWrapper = styled.div`
  height: fit-content;
`;

export const TokenIcon = styled.img`
  height: 24px;
  width: 24px;
`;

export const IconPairContainer = styled.div`
  padding-top: 8px;
  margin-right: 8px;
`;
