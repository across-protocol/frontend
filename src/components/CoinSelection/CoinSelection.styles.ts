import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow } from "../Buttons";
import { ChevronDown } from "react-feather";
import { motion } from "framer-motion";
import { COLORS, QUERIES } from "utils";
import { RoundBox as UnstyledBox, ErrorBox as UnstyledErrorBox } from "../Box";

export const Wrapper = styled.div`
  --radius: 30px;
  display: flex;
  flex-direction: column;
`;
// User agents wars, so have to check for chrome too
const isSafari =
  navigator.userAgent.search("Safari") >= 0 &&
  navigator.userAgent.search("Chrome") < 0;

interface IStyledRoundBox {
  disabled?: boolean;
}
export const RoundBox = styled(UnstyledBox)<IStyledRoundBox>`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  font-size: ${16 / 16}rem;
  padding: 10px 15px;
  margin-top: 16px;
  display: flex;
  opacity: ${(props) => (props.disabled ? "0.7" : "1")};
  @media ${QUERIES.tabletAndUp} {
    flex: 2;

    &:first-of-type {
      margin-right: 16px;
      flex: 1;
    }
  }
  &:not(:first-of-type):focus-within {
    outline: ${isSafari ? "none" : "var(--outline-color) solid 1px"};
  }
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  @media ${QUERIES.tabletAndUp} {
    flex-direction: row;
  }
`;

interface IStyledToggleButton {
  disabled?: boolean;
}
export const ToggleButton = styled.button<IStyledToggleButton>`
  --radius: 30px;
  width: 100%;
  padding: 0;
  margin: 0;
  font-size: inherit;
  color: var(--color-gray);
  background-color: inherit;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? "0.7" : "1")};
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 10px;
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
  padding-top: 10px;
  transform: translateY(50%);
  box-shadow: ${({ isOpen }) =>
    isOpen ? `0px 160px 8px 8px hsla(${COLORS.gray[500]} / 0.2)` : "none"};
  list-style: none;
  display: flex;
  flex-direction: column;
  z-index: 1;
  outline: none;
  pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
  @media ${QUERIES.tabletAndUp} {
    transform: translateY(100%);
  }
`;

export const Item = motion(styled.li`
  padding: 15px 10px 10px;
  display: flex;
  gap: 10px;
  cursor: pointer;
  background-color: var(--color-white);
  color: var(--color-gray);
  transition: background-color 100ms linear;
  &:first-of-type {
    border-radius: calc(var(--radius) / 4) calc(var(--radius) / 4) 0 0;
  }

  &:last-of-type {
    border-radius: 0 0 calc(var(--radius) / 4) calc(var(--radius) / 4);
  }

  &:hover {
    background-color: var(--color-gray-100);
  }

  & > div:last-of-type {
    margin-left: auto;
    color: hsla(${COLORS.gray[500]} / 0.5);
  }
`);

export const ToggleIcon = styled(ChevronDown)`
  margin-left: auto;
`;

export const MaxButton = styled(SecondaryButtonWithoutShadow)`
  text-transform: uppercase;
  padding: 10px 20px;
  font-size: ${14 / 16}rem;
  transition: background-color 100ms linear;
  &::after {
    box-shadow: none;
  }
  &:hover {
    background-color: var(--color-gray-300);
  }
`;

export const Input = styled.input`
  border: none;
  font-size: inherit;
  background-color: inherit;
  padding: 0;
  margin: 0;
  width: 100%;
  text-align: right;
  outline: none;

  &::placeholder {
    color: var(--color-gray-300);
  }
`;

export const ErrorBox = motion(styled(UnstyledErrorBox)`
  margin-top: 10px;
  display: none;
`);

export const BalanceLabel = styled.span`
  display: block;
  margin: 10px 25px 0 0;
  height: ${16 / 16}rem;
  font-size: ${12 / 16}rem;
  line-height: ${16 / 16}rem;
  font-weight: 400;
  text-align: right;
`;
