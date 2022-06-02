import styled from "@emotion/styled";
import { Section } from "../Section";
import { PrimaryButton, BaseButton } from "../Buttons";
import { ChevronDown } from "react-feather";
import { motion } from "framer-motion";
import { RoundBox as UnstyledBox, ErrorBox } from "../Box";

export const LastSection = styled(Section)`
  border-bottom: none;
`;
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

interface IStyledRoundBox {
  disabled?: boolean;
}

export const RoundBox = styled(UnstyledBox)<IStyledRoundBox>`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  display: block;
  padding: 10px 15px;
  margin-top: 16px;
  margin-right: auto;
  margin-left: auto;
  opacity: ${(props) => (props.disabled ? "0.7" : "1")};
  &:not(:first-of-type):focus-within {
    outline: var(--outline-color) solid 1px;
  }
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 20px;
`;

export const Info = styled.div`
  & > div {
    line-height: 1;
  }
`;
export const Address = styled.div`
  font-size: ${14 / 16}rem;
  text-align: left;
`;

export const ChangeWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-right: 8px;
`;

export const ChangeButton = styled.div`
  color: #6cf9d8;
  font-size: 0.8rem;

  cursor: pointer;
  margin-top: 4px;
  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const DialogTitle = styled.h3``;

export const InputWrapper = styled(RoundBox)`
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-white);
  padding: 16px;
  margin: 14px 0 25px 0;
  &:focus-within {
    outline: var(--color-primary-dark) solid 1px;
  }
`;
export const Input = styled.input`
  width: 100%;
  border: none;
  background-color: inherit;
  outline: none;
`;

export const InputError = styled.div`
  color: var(--color-gray);
  font-size: ${12 / 16}rem;
  position: absolute;
  bottom: 0;
  right: 16px;
  transform: translateY(105%);
`;

export const ClearButton = styled(BaseButton)`
  display: flex;
  align-items: center;
  padding: 0;
`;
export const CancelButton = styled(PrimaryButton)`
  border: 1px solid var(--color-gray-300);
`;
export const ButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  & > button {
    flex: 1;
  }
`;

type MenuProps = {
  isOpen: boolean;
};

export const Menu = styled.ul<MenuProps>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  // HACK: we use this as padding, to prevent elements overflowing into the label when scrolling up
  border-top: 10px solid transparent;
  transform: translateY(60px);
  height: fit-content;
  max-height: 50vh;
  overflow-y: auto;
  list-style: none;
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
  outline: none;
  flex-direction: column;
  z-index: 10000;
  width: 95%;
  margin: 0 auto;
  box-shadow: inset 0 8px 8% rgba(45, 46, 51, 0.2);
`;

export const WarningBox = styled(ErrorBox)`
  margin-top: 20px;
`;

export const Item = motion(styled.li`
  padding: 15px 10px 10px;
  display: flex;
  gap: 10px;
  cursor: pointer;
  background-color: var(--color-white);
  transition: background-color 100ms linear;

  &:first-of-type {
    border-radius: 16px 16px 0 0;
  }

  &:last-of-type {
    border-radius: 0 0 16px 16px;
  }

  &:hover {
    background-color: var(--color-gray-100);
  }

  & > div:last-of-type {
    margin-left: 0.25rem;
    color: #2d2e33;
  }

  &.disabled {
    background-color: var(--color-white);
    color: rgba(255, 255, 255, 0.65);
    pointer-events: none;
    cursor: not-allowed;
    > * {
      opacity: 0.5;
    }
  }
`);

export const ToggleIcon = styled(ChevronDown)`
  margin-left: auto;
`;

interface IStyledToggleButton {
  disabled?: boolean;
}
export const ToggleButton = styled.button<IStyledToggleButton>`
  --radius: 30px;
  width: 100%;
  color: var(--color-gray);
  padding: 0;
  margin: 0;
  font-size: inherit;
  background-color: inherit;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? "0.7" : "1")};
`;

export const InputGroup = styled.div`
  position: relative;
  width: 100%;
`;

export const ToggleChainName = styled.div`
  text-align: left;
`;
