import { useState, useRef } from "react";

import useClickOutside from "hooks/useClickOutside";
import { DepositType } from "../../types";

import {
  FilterContainer,
  FilterButton,
  StyledChevronIcon,
  DropdownMenu,
  DropdownItem,
} from "./shared";

type DepositTypeFilterProps = {
  value: DepositType | undefined;
  onChange: (value: DepositType | undefined) => void;
};

const DEPOSIT_TYPE_OPTIONS: {
  value: DepositType | undefined;
  label: string;
}[] = [
  { value: undefined, label: "All types" },
  { value: "across", label: "Across" },
  { value: "cctp", label: "CCTP" },
  { value: "oft", label: "OFT" },
];

export function DepositTypeFilter({ value, onChange }: DepositTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    DEPOSIT_TYPE_OPTIONS.find((opt) => opt.value === value) ??
    DEPOSIT_TYPE_OPTIONS[0];

  useClickOutside(containerRef, () => setIsOpen(false));

  return (
    <FilterContainer ref={containerRef}>
      <FilterButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        <span>Type: {selectedOption.label}</span>
        <StyledChevronIcon isOpen={isOpen} />
      </FilterButton>
      {isOpen && (
        <DropdownMenu>
          {DEPOSIT_TYPE_OPTIONS.map((option) => (
            <DropdownItem
              key={option.value ?? "all"}
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
