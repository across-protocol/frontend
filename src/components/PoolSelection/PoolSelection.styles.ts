import styled from "@emotion/styled";
import { ChevronDown } from "react-feather";
import { motion } from "framer-motion";
import { COLORS, QUERIES } from "utils";
import { RoundBox as UnstyledBox, ErrorBox as UnstyledErrorBox } from "../Box";
import { Section } from "../Section";

export const Wrapper = styled(Section)`
  --radius: 30px;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  padding-top: 15px;
  @media ${QUERIES.tabletAndUp} {
    padding-top: 30px;
  }
`;
export const RoundBox = styled(UnstyledBox)`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  display: block;
  padding: 10px 15px;
  margin-top: 16px;
  margin-right: auto;
  margin-left: auto;
  &:not(:first-of-type):focus-within {
    outline: var(--outline-color) solid 1px;
  }
`;

export const InputGroup = styled.div`
  position: relative;
  width: 100%;
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
  transform: translateY(100%);
  pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
  outline: none;
  list-style: none;
  display: flex;
  flex-direction: column;
  z-index: 1;
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

export const ToggleButton = styled.button`
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
  cursor: pointer;
`;

export const ErrorBox = styled(UnstyledErrorBox)`
  margin-top: 10px;
`;
