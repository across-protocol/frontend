import styled from "@emotion/styled";
import { SecondaryButton } from "../Buttons";
import { ChevronDown } from "react-feather";
import { COLORS } from "utils";
import { RoundBox as UnstyledBox } from "../Box";

export const Wrapper = styled.div`
  --radius: 30px;
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
`;
export const RoundBox = styled(UnstyledBox)`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  padding: 10px 15px;
  margin-top: 16px;
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

export const Item = styled.li`
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
`;

export const ToggleIcon = styled(ChevronDown)`
  margin-left: 60px;
`;

export const MaxButton = styled(SecondaryButton)`
  text-transform: uppercase;
  padding: 10px 20px;
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
    color: var(--color-gray-100);
  }
`;

export const ErrorBox = styled(RoundBox)`
  background-color: var(--color-error);
  color: var(--color-gray);
`;
