import styled from "@emotion/styled";
import { useState, useRef, useEffect } from "react";

import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { COLORS } from "utils/constants";
import { DepositStatusFilter } from "utils/types";

type StatusFilterProps = {
  value: DepositStatusFilter;
  onChange: (value: DepositStatusFilter) => void;
};

const STATUS_OPTIONS: { value: DepositStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "filled", label: "Filled" },
  { value: "refunded", label: "Refunded" },
  { value: "expired", label: "Expired" },
  { value: "slowFillRequested", label: "Slow Fill Requested" },
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = STATUS_OPTIONS.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <FilterContainer ref={containerRef}>
      <FilterButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        <span>Status: {selectedOption?.label}</span>
        <StyledChevronIcon isOpen={isOpen} />
      </FilterButton>
      {isOpen && (
        <DropdownMenu>
          {STATUS_OPTIONS.map((option) => (
            <DropdownItem
              key={option.value}
              isSelected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </FilterContainer>
  );
}

const FilterContainer = styled.div`
  position: relative;
`;

const FilterButton = styled.button<{ isOpen: boolean }>`
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

const StyledChevronIcon = styled(ChevronDownIcon)<{ isOpen: boolean }>`
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};

  path {
    stroke: ${COLORS["grey-400"]};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 100%;
  background: ${COLORS["black-900"]};
  border: 1px solid ${COLORS["black-700"]};
  border-radius: 10px;
  box-shadow: 0px 16px 32px 0px rgba(0, 0, 0, 0.2);
  z-index: 10;
  overflow: hidden;
`;

const DropdownItem = styled.button<{ isSelected: boolean }>`
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
