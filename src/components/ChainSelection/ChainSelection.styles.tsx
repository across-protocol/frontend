import styled from "@emotion/styled";
import { PrimaryButton } from "../Buttons";
import { RoundBox as UnstyledBox } from "../Box";
import { ChevronDown } from "react-feather";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 20px;
`;

export const RoundBox = styled(UnstyledBox)`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  font-size: ${16 / 16}rem;
  padding: 10px 15px;
  margin-top: 16px;
  margin-right: auto;
  margin-left: auto;
  flex: 2;
  display: flex;
  &:not(:first-of-type):focus-within {
    outline: var(--outline-color) solid 1px;
  }
  &:first-of-type {
    /* margin-right: 16px; */
    flex: 1;
  }
`;

export const ConnectButton = styled(PrimaryButton)`
  margin-top: 16px;
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 20px;
`;

interface IMenuProps {
  isOpen?: boolean;
}

export const Menu = styled.ul<IMenuProps>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding-top: 10px;
  transform: translateY(100%);
  box-shadow: inset 0 8px 8% rgba(45, 46, 51, 0.2);
  list-style: none;
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  flex-direction: column;
  z-index: 10000;
  width: 95%;
  margin: 0 auto;
`;

export const Item = styled.li`
  padding: 15px 10px 10px;
  display: flex;
  gap: 10px;
  cursor: pointer;
  background-color: var(--color-white);

  font-family: "Barlow";
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

  div {
    flex-basis: 15%;
  }

  span {
    color: #2d2e33;
    flex-basis: 75%;
    text-align: right;
    padding-right: 8px;
  }

  &.disabled {
    background-color: var(--color-white);
    color: rgba(255, 255, 255, 0.65);

    > * {
      opacity: 0.5;
    }
  }
`;

export const ToggleIcon = styled(ChevronDown)`
  margin-left: 250px;
`;

export const ToggleButton = styled.button`
  --radius: 30px;
  padding: 0;
  margin: 0;
  font-size: inherit;
  background-color: inherit;
  border: none;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
  width: 100%;
`;

export const ToggleChainName = styled.div`
  width: 85px;
  text-align: left;
`;
