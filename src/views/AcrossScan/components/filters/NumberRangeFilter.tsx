import styled from "@emotion/styled";
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

type NumberRangeFilterProps = {
  label: string;
  startValue: number | undefined;
  endValue: number | undefined;
  onStartChange: (value: number | undefined) => void;
  onEndChange: (value: number | undefined) => void;
};

function formatRangeSummary(
  start: number | undefined,
  end: number | undefined
): string {
  if (start !== undefined && end !== undefined) return `${start}-${end}`;
  if (start !== undefined) return `${start}+`;
  if (end !== undefined) return `-${end}`;
  return "";
}

export function NumberRangeFilter({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: NumberRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startInput, setStartInput] = useState(startValue?.toString() ?? "");
  const [endInput, setEndInput] = useState(endValue?.toString() ?? "");
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const handleApply = () => {
    const start = startInput.trim() ? Number(startInput.trim()) : undefined;
    const end = endInput.trim() ? Number(endInput.trim()) : undefined;
    onStartChange(start !== undefined && !isNaN(start) ? start : undefined);
    onEndChange(end !== undefined && !isNaN(end) ? end : undefined);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setStartInput(startValue?.toString() ?? "");
    setEndInput(endValue?.toString() ?? "");
    setIsOpen(!isOpen);
  };

  const rangeSummary = formatRangeSummary(startValue, endValue);

  return (
    <FilterContainer ref={containerRef}>
      <FilterButton onClick={handleOpen} isOpen={isOpen}>
        <span>
          {label}
          {rangeSummary ? `: ${rangeSummary}` : ""}
        </span>
        <StyledChevronIcon isOpen={isOpen} />
      </FilterButton>
      {isOpen && (
        <PopoverMenu>
          <RangeRow>
            <PopoverInput
              type="number"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              placeholder="From"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
              autoFocus
            />
            <PopoverInput
              type="number"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              placeholder="To"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
            />
          </RangeRow>
          <PopoverApplyButton onClick={handleApply}>Apply</PopoverApplyButton>
        </PopoverMenu>
      )}
    </FilterContainer>
  );
}

const RangeRow = styled.div`
  display: flex;
  gap: 8px;
`;
