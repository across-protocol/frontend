import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";

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

  @media ${QUERIESV2.sm} {
    flex-direction: column;
    gap: 12px;
  }
`;

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

  border: 1px solid ${({ valid }) => (valid ? "#4c4e57" : "#f96c6c")};
  color: ${({ valid }) => (valid ? "#e0f3ff" : "#f96c6c")};

  @media ${QUERIESV2.sm} {
    padding: 0px 12px;
    height: 48px;
  }
`;

interface IStakeInput {
  valid: boolean;
}
export const Input = styled.input`
  background: transparent;
  color: #9daab2;
  font-size: 16px;
  border: none;
  width: 100%;
  padding: 0;

  &:focus {
    outline: 0;
  }
  @media ${QUERIESV2.sm} {
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
  @media ${QUERIESV2.sm} {
    height: 24px;
    padding: 0px 10px;
  }
`;

export const ButtonWrapper = styled.div`
  flex-grow: 1;
  @media ${QUERIESV2.sm} {
    width: 100%;
  }
`;

interface IStakeButton {
  valid: boolean;
  fullWidth?: boolean;
}
export const StakeButton = styled(UnstyledButton)<IStakeButton>`
  width: ${({ fullWidth }) => (fullWidth ? "100%" : "inherit")};
  background: #6cf9d8;
  padding: 0px 40px;
  height: 64px;
  color: #2d2e33;
  opacity: ${({ valid }) => (valid ? 1 : 0.25)};
  @media ${QUERIESV2.sm} {
    text-align: center;
    width: 100%;
    height: 40px;
    padding: 0px 20px;
    border-radius: 20px;
  }
`;
