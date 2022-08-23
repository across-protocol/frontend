import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";

export const InputRow = styled.div`
  display: flex;
  gap: 16px;
  flex-direction: row;
  @media ${QUERIESV2.sm} {
    flex-direction: column;
  }

  & svg {
    height: 24px;
    width: 24px;
    position: absolute;
    left: 24px;
    top: 20px;
    @media ${QUERIESV2.sm} {
      top: 12px;
      left: 12px;
    }
  }
`;

export const InputWrapper = styled.div`
  flex-grow: 8;
  position: relative;
`;

interface IStakeInput {
  valid: boolean;
}
export const Input = styled.input<IStakeInput>`
  height: 64px;
  padding: 9px 64px;
  width: 100%;
  background: #2d2e33;
  border-radius: 32px;
  border: 1px solid ${({ valid }) => (valid ? "#4c4e57" : "#f96c6c")};
  color: ${({ valid }) => (valid ? "#e0f3ff" : "#f96c6c")};
  &:focus {
    outline: 0;
  }
  @media ${QUERIESV2.sm} {
    height: 48px;
    padding: 9px 48px;
  }
`;

export const MaxButton = styled(UnstyledButton)`
  height: 24px;
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #c5d5e0;
  position: absolute;
  padding: 8px 10px 10px;
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

  top: 20px;
  right: 24px;
  @media ${QUERIESV2.sm} {
    top: 12px;
    right: 12px;
  }
`;

export const ButtonWrapper = styled.div`
  flex-grow: 1;
`;

interface IStakeButton {
  valid: boolean;
}
export const StakeButton = styled(UnstyledButton)<IStakeButton>`
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
