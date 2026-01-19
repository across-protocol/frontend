import styled from "@emotion/styled";
import { UnstyledButton } from "components";
import { Input, InputGroup } from "components/Input";
import { Text } from "components/Text";
import { COLORS } from "utils";

type WalletAddressFilterProps = {
  value: string;
  onChange: (value: string) => void;
  connectedAddress?: string;
};

export function WalletAddressFilter({
  value,
  onChange,
  connectedAddress,
}: WalletAddressFilterProps) {
  return (
    <FilterSection>
      <FilterInputWrapper>
        <InputGroup validationLevel="valid">
          <Input
            type="text"
            placeholder="Filter by wallet address"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            validationLevel="valid"
          />
        </InputGroup>
        {value.trim().length > 0 && (
          <QuickFilterButton onClick={() => onChange("")}>
            Clear
          </QuickFilterButton>
        )}
        {connectedAddress && (
          <QuickFilterButton onClick={() => onChange(connectedAddress)}>
            Filter by my Address
          </QuickFilterButton>
        )}
      </FilterInputWrapper>
    </FilterSection>
  );
}

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 240px;
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  padding-left: 2px;
`;

const FilterInputWrapper = styled.div`
  max-width: 600px;
  width: 100%;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const QuickFilterButton = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 10px;
  height: 24px;
  width: fit-content;
  border: 1px solid ${COLORS["grey-400"]};
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${COLORS["grey-400"]};
  white-space: nowrap;

  &:hover {
    color: ${COLORS["aqua"]};
    border-color: ${COLORS["aqua"]};
  }
`;
