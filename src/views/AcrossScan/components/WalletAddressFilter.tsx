import styled from "@emotion/styled";
import { useHistory } from "react-router-dom";
import { ReactComponent as SearchIcon } from "assets/icons/search.svg";
import { COLORS } from "utils";
import { isValidTxHash } from "utils/transactions";

type FilterMode = "all" | "evm" | "svm";

type WalletAddressFilterProps = {
  value: string;
  onChange: (value: string) => void;
  evmAddress?: string;
  svmAddress?: string;
};

export function WalletAddressFilter({
  value,
  onChange,
  evmAddress,
  svmAddress,
}: WalletAddressFilterProps) {
  const history = useHistory();
  const hasMultipleWallets = Boolean(evmAddress && svmAddress);
  const isTxHash = isValidTxHash(value.trim());

  const getFilterMode = (): FilterMode => {
    if (evmAddress && value === evmAddress) return "evm";
    if (svmAddress && value === svmAddress) return "svm";
    return "all";
  };

  const filterMode = getFilterMode();

  const handleModeChange = (mode: FilterMode) => {
    if (mode === "all") {
      onChange("");
    } else if (mode === "evm" && evmAddress) {
      onChange(evmAddress);
    } else if (mode === "svm" && svmAddress) {
      onChange(svmAddress);
    }
  };

  const hasAnyWallet = evmAddress || svmAddress;
  const singleWalletAddress = evmAddress || svmAddress;

  return (
    <FilterContainer>
      <SearchInputWrapper>
        <StyledSearchIcon />
        <SearchInput
          type="text"
          placeholder="Search by wallet or tx hash"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </SearchInputWrapper>
      {isTxHash ? (
        <ViewTransactionButton
          onClick={() => history.push(`/transaction/${value.trim()}`)}
        >
          View transaction
        </ViewTransactionButton>
      ) : (
        <SegmentedToggle>
          <ToggleButton
            isActive={filterMode === "all"}
            onClick={() => handleModeChange("all")}
          >
            Show All
          </ToggleButton>
          {hasMultipleWallets ? (
            <>
              <ToggleButton
                isActive={filterMode === "evm"}
                onClick={() => handleModeChange("evm")}
              >
                EVM Wallet
              </ToggleButton>
              <ToggleButton
                isActive={filterMode === "svm"}
                onClick={() => handleModeChange("svm")}
              >
                SVM Wallet
              </ToggleButton>
            </>
          ) : (
            <ToggleButton
              isActive={filterMode !== "all"}
              onClick={() => {
                if (singleWalletAddress) {
                  onChange(singleWalletAddress);
                }
              }}
              disabled={!hasAnyWallet}
            >
              My Wallet
            </ToggleButton>
          )}
        </SegmentedToggle>
      )}
    </FilterContainer>
  );
}

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 40px;
  min-width: 300px;
  background: ${COLORS["grey-600"]};
  border-radius: 8px;
  border: 1px solid transparent;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: ${COLORS["grey-400"]};
  }
`;

const StyledSearchIcon = styled(SearchIcon)`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.5;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: ${COLORS.white};
  font-size: 14px;
  font-family: Barlow, sans-serif;

  &::placeholder {
    color: ${COLORS["grey-400"]};
  }
`;

const SegmentedToggle = styled.div`
  display: flex;
  align-items: center;
  background: ${COLORS["grey-600"]};
  border-radius: 8px;
  padding: 4px;
`;

const ToggleButton = styled.button<{ isActive: boolean; disabled?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-family: Barlow, sans-serif;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  white-space: nowrap;

  background: ${({ isActive }) =>
    isActive ? COLORS["grey-500"] : "transparent"};
  color: ${({ isActive, disabled }) =>
    disabled
      ? COLORS["grey-400"] + "80"
      : isActive
        ? COLORS.white
        : COLORS["grey-400"]};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    color: ${({ isActive }) => (isActive ? COLORS.white : COLORS["grey-400"])};
    background: ${({ isActive }) =>
      isActive ? COLORS["grey-500"] : "rgba(255, 255, 255, 0.05)"};
  }
`;

const ViewTransactionButton = styled.button`
  padding: 8px 16px;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-family: Barlow, sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${COLORS.aqua};
  color: ${COLORS["black-800"]};

  &:hover {
    opacity: 0.9;
  }
`;
