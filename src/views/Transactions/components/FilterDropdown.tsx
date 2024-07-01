import styled from "@emotion/styled";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { ReactComponent as ArrowDownIcon } from "assets/icons/chevron-down.svg";
import { Text } from "components/Text";
import { COLORS } from "utils";

type Props = {
  filterLabel: string;
  selectedFilter: string;
  filterOptions: string[];
  onSelectFilter: (filter: string) => void;
};

export function FilterDropdown({
  filterLabel,
  selectedFilter,
  filterOptions,
  onSelectFilter,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <StatusFilterWrapper>
          <Text color="grey-400">{filterLabel}:</Text>
          <Text color="light-200" casing="capitalize">
            {selectedFilter}
          </Text>
          {isOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </StatusFilterWrapper>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom">
        {filterOptions.map((filter) => (
          <DropdownMenuItem key={filter} onClick={() => onSelectFilter(filter)}>
            <Text color="grey-400" casing="capitalize">
              {filter}
            </Text>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu.Root>
  );
}

const ArrowUpIcon = styled(ArrowDownIcon)`
  transform: rotate(180deg);
`;

const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
  cursor: pointer;
`;

const StatusFilterWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const DropdownMenuContent = styled(DropdownMenu.Content)`
  display: flex;
  width: 240px;
  flex-direction: column;
  z-index: 2 !important;

  border-radius: 10px;
  border: 1px solid ${COLORS["black-700"]};
  background: ${COLORS["black-900"]};
  box-shadow: 0px 16px 32px 0px rgba(0, 0, 0, 0.2);
`;

const DropdownMenuItem = styled(DropdownMenu.Item)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  border: none;

  &:hover {
    background: ${COLORS["black-800"]};
  }

  > svg {
    height: 16px;
    width: 16px;
  }
`;
