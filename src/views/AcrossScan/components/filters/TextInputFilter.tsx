import { useState, useRef } from "react";

import useClickOutside from "hooks/useClickOutside";

import {
  FilterContainer,
  FilterButton,
  StyledChevronIcon,
  PopoverMenu,
  PopoverInput,
  PopoverApplyButton,
} from "./shared";

type TextInputFilterProps = {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
};

export function TextInputFilter({
  label,
  value,
  onChange,
  placeholder,
}: TextInputFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const handleApply = () => {
    const trimmed = inputValue.trim();
    onChange(trimmed || undefined);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setInputValue(value ?? "");
    setIsOpen(!isOpen);
  };

  const truncatedValue =
    value && value.length > 10
      ? `${value.slice(0, 6)}...${value.slice(-4)}`
      : value;

  return (
    <FilterContainer ref={containerRef}>
      <FilterButton onClick={handleOpen} isOpen={isOpen}>
        <span>
          {label}
          {value ? `: ${truncatedValue}` : ""}
        </span>
        <StyledChevronIcon isOpen={isOpen} />
      </FilterButton>
      {isOpen && (
        <PopoverMenu>
          <PopoverInput
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
            }}
            autoFocus
          />
          <PopoverApplyButton onClick={handleApply}>Apply</PopoverApplyButton>
        </PopoverMenu>
      )}
    </FilterContainer>
  );
}
