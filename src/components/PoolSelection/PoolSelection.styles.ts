import styled from "@emotion/styled";
import { ChevronDown } from "react-feather";
import { motion } from "framer-motion";
import { COLORS } from "utils";
import { RoundBox as UnstyledBox, ErrorBox as UnstyledErrorBox } from "../Box";
import { Section } from "../Section";

export const Wrapper = styled(Section)`
  --radius: 30px;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  padding-top: 30px;
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
    margin-right: 16px;
    flex: 1;
  }
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
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

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 10px;
`;
export const Menu = styled.ul`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding-top: 10px;
  transform: translateY(100%);
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
  margin-left: 325px;
`;

export const ErrorBox = styled(UnstyledErrorBox)`
  margin-top: 10px;
`;
