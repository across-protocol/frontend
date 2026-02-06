import styled from "@emotion/styled";
import { useState, useRef } from "react";

import useClickOutside from "hooks/useClickOutside";
import { chainInfoList } from "constants/chains";
import { getChainInfo } from "utils/constants";

import {
  FilterContainer,
  FilterButton,
  StyledChevronIcon,
  DropdownMenu,
  DropdownItem,
} from "./shared";

type ChainFilterProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

export function ChainFilter({ label, value, onChange }: ChainFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedChain = value ? getChainInfo(value) : undefined;

  useClickOutside(containerRef, () => setIsOpen(false));

  return (
    <FilterContainer ref={containerRef}>
      <FilterButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        {selectedChain && (
          <ChainLogo src={selectedChain.logoURI} alt={selectedChain.name} />
        )}
        <span>
          {label}: {selectedChain?.name || "All"}
        </span>
        <StyledChevronIcon isOpen={isOpen} />
      </FilterButton>
      {isOpen && (
        <ChainDropdownMenu>
          <DropdownItem
            isSelected={value === undefined}
            onClick={() => {
              onChange(undefined);
              setIsOpen(false);
            }}
          >
            All chains
          </DropdownItem>
          {chainInfoList.map((chain) => (
            <DropdownItem
              key={chain.chainId}
              isSelected={value === chain.chainId}
              onClick={() => {
                onChange(chain.chainId);
                setIsOpen(false);
              }}
            >
              <ChainOptionContent>
                <ChainLogo src={chain.logoURI} alt={chain.name} />
                {chain.name}
              </ChainOptionContent>
            </DropdownItem>
          ))}
        </ChainDropdownMenu>
      )}
    </FilterContainer>
  );
}

const ChainDropdownMenu = styled(DropdownMenu)`
  max-height: 320px;
  overflow-y: auto;
`;

const ChainLogo = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`;

const ChainOptionContent = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;
