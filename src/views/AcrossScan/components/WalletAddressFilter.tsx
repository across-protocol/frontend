import styled from "@emotion/styled";
import { useHistory } from "react-router-dom";
import { isAddress as isEVMAddress } from "viem";
import { isAddress as isSVMAddress } from "@solana/kit";
import { ReactComponent as SearchIcon } from "assets/icons/search.svg";
import { COLORS } from "utils/constants";
import { isValidTxHash } from "utils/transactions";

type WalletAddressFilterProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  evmAddress?: string;
  svmAddress?: string;
};

export function WalletAddressFilter({
  inputValue,
  onInputChange,
  onSearch,
  evmAddress,
  svmAddress,
}: WalletAddressFilterProps) {
  const history = useHistory();
  const hasMultipleWallets = Boolean(evmAddress && svmAddress);
  const trimmedInput = inputValue.trim();
  const isTxHash = isValidTxHash(trimmedInput);
  const isValidAddress =
    isEVMAddress(trimmedInput) || isSVMAddress(trimmedInput);
  const canSearch = isTxHash || isValidAddress || trimmedInput === "";

  const isEvmActive = Boolean(evmAddress && inputValue === evmAddress);
  const isSvmActive = Boolean(svmAddress && inputValue === svmAddress);

  const handleWalletFilter = (address: string) => {
    onInputChange(address);
    onSearch(address);
  };

  const handleSearchClick = () => {
    if (isTxHash) {
      history.push(`/transaction/${trimmedInput}`);
    } else if (canSearch) {
      onSearch(trimmedInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSearch) {
      handleSearchClick();
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
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </SearchInputWrapper>
      <SearchButton onClick={handleSearchClick} disabled={!canSearch}>
        {isTxHash ? "View" : "Search"}
      </SearchButton>
      {!isTxHash && hasMultipleWallets ? (
        <>
          <WalletButton
            isActive={isEvmActive}
            onClick={() => handleWalletFilter(evmAddress!)}
          >
            Filter my EVM wallet
          </WalletButton>
          <WalletButton
            isActive={isSvmActive}
            onClick={() => handleWalletFilter(svmAddress!)}
          >
            Filter my SVM wallet
          </WalletButton>
        </>
      ) : !isTxHash && hasAnyWallet ? (
        <WalletButton
          isActive={isEvmActive || isSvmActive}
          onClick={() => handleWalletFilter(singleWalletAddress!)}
        >
          Filter my {evmAddress ? "EVM" : "SVM"} wallet
        </WalletButton>
      ) : null}
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

const WalletButton = styled.button<{ isActive: boolean }>`
  padding: 0 14px;
  height: 40px;
  border: 1px solid
    ${({ isActive }) => (isActive ? COLORS["grey-400"] : "transparent")};
  border-radius: 8px;
  font-size: 14px;
  font-family: Barlow, sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${COLORS["grey-600"]};
  color: ${({ isActive }) => (isActive ? COLORS.white : COLORS["grey-400"])};

  &:hover {
    border-color: ${COLORS["grey-400"]};
  }
`;

const SearchButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-family: Barlow, sans-serif;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  white-space: nowrap;
  background: ${({ disabled }) =>
    disabled ? COLORS["grey-500"] : COLORS.aqua};
  color: ${({ disabled }) =>
    disabled ? COLORS["grey-400"] : COLORS["black-800"]};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;
