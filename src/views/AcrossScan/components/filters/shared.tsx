import styled from "@emotion/styled";

import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { COLORS } from "utils/constants";

export const FilterContainer = styled.div`
  position: relative;
`;

export const FilterButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 40px;
  background: ${COLORS["grey-600"]};
  border-radius: 8px;
  border: 1px solid
    ${({ isOpen }) => (isOpen ? COLORS["grey-400"] : "transparent")};
  color: ${COLORS.white};
  font-size: 14px;
  font-family: Barlow, sans-serif;
  cursor: pointer;
  transition: border-color 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${COLORS["grey-400"]};
  }
`;

export const StyledChevronIcon = styled(ChevronDownIcon)<{ isOpen: boolean }>`
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};

  path {
    stroke: ${COLORS["grey-400"]};
  }
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  background: ${COLORS["black-900"]};
  border: 1px solid ${COLORS["black-700"]};
  border-radius: 10px;
  box-shadow: 0px 16px 32px 0px rgba(0, 0, 0, 0.2);
  z-index: 10;
  overflow: hidden;
`;

export const DropdownItem = styled.button<{ isSelected: boolean }>`
  display: flex;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: ${({ isSelected }) =>
    isSelected ? COLORS["black-800"] : "transparent"};
  color: ${({ isSelected }) =>
    isSelected ? COLORS.white : COLORS["grey-400"]};
  font-size: 14px;
  font-family: Barlow, sans-serif;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;

  &:hover {
    background: ${COLORS["black-800"]};
  }
`;

export const PopoverMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 240px;
  background: ${COLORS["black-900"]};
  border: 1px solid ${COLORS["black-700"]};
  border-radius: 10px;
  box-shadow: 0px 16px 32px 0px rgba(0, 0, 0, 0.2);
  z-index: 10;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PopoverInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${COLORS["grey-600"]};
  border: 1px solid ${COLORS["black-700"]};
  border-radius: 8px;
  color: ${COLORS.white};
  font-size: 14px;
  font-family: Barlow, sans-serif;
  outline: none;

  &::placeholder {
    color: ${COLORS["grey-400"]};
  }

  &:focus {
    border-color: ${COLORS["grey-400"]};
  }
`;

export const PopoverApplyButton = styled.button`
  padding: 8px 16px;
  background: ${COLORS["aqua"]};
  border: none;
  border-radius: 8px;
  color: ${COLORS["black-900"]};
  font-size: 14px;
  font-family: Barlow, sans-serif;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
