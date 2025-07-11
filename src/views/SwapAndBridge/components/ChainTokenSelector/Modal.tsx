import Modal from "components/Modal";
import { EnrichedTokenSelect } from "./SelectorButton";
import styled from "@emotion/styled";
import Searchbar from "./Searchbar";
import TokenMask from "assets/mask/token-mask-corner.svg";
import useAvailableCrosschainRoutes, {
  LifiToken,
} from "hooks/useAvailableCrosschainRoutes";
import {
  COLORS,
  formatUnitsWithMaxFractions,
  formatUSD,
  getChainInfo,
  parseUnits,
} from "utils";
import { useMemo, useState } from "react";
import { ReactComponent as CheckmarkCircle } from "assets/icons/checkmark-circle.svg";
import AllChainsIcon from "assets/chain-logos/all-swap-chain.png";
import useEnrichedCrosschainBalances from "hooks/useEnrichedCrosschainBalances";
import { BigNumber } from "ethers";

type Props = {
  onSelect: (token: EnrichedTokenSelect) => void;
  isOriginToken: boolean;

  displayModal: boolean;
  setDisplayModal: (displayModal: boolean) => void;
};

export default function ChainTokenSelectorModal({
  isOriginToken,
  displayModal,
  setDisplayModal,
  onSelect,
}: Props) {
  const balances = useEnrichedCrosschainBalances();

  const crossChainRoutes = useAvailableCrosschainRoutes();

  const [selectedChain, setSelectedChain] = useState<number | null>(null);

  const [tokenSearch, setTokenSearch] = useState("");
  const [chainSearch, setChainSearch] = useState("");

  const displayedTokens = useMemo(() => {
    let tokens = selectedChain ? (balances[selectedChain] ?? []) : [];

    if (tokens.length === 0 && selectedChain === null) {
      tokens = Object.values(balances).flatMap((t) => t);
    }
    // Return ordering top 100 tokens ordering highest balanceUsd to lowest (fallback alphabetical)
    const sortedTokens = tokens.slice(0, 100).sort((a, b) => {
      if (Math.abs(b.balanceUsd - a.balanceUsd) < 0.0001) {
        return a.symbol.toLocaleLowerCase().localeCompare(b.symbol);
      }
      return b.balanceUsd - a.balanceUsd;
    });

    return sortedTokens.filter((t) => {
      if (tokenSearch === "") {
        return true;
      }
      const keywords = [
        t.symbol.toLowerCase().replaceAll(" ", ""),
        t.name.toLowerCase().replaceAll(" ", ""),
        t.address.toLowerCase().replaceAll(" ", ""),
      ];
      return keywords.some((keyword) =>
        keyword.includes(tokenSearch.toLowerCase().replaceAll(" ", ""))
      );
    });
  }, [selectedChain, balances, tokenSearch]);

  const displayedChains = useMemo(() => {
    return Object.fromEntries(
      Object.entries(crossChainRoutes.data || {}).filter(([chainId]) => {
        if ([288].includes(Number(chainId))) {
          return false;
        }

        const keywords = [
          String(chainId),
          getChainInfo(Number(chainId)).name.toLowerCase().replace(" ", ""),
        ];
        return keywords.some((keyword) =>
          keyword.toLowerCase().includes(chainSearch.toLowerCase())
        );
      })
    );
  }, [chainSearch, crossChainRoutes.data]);

  return (
    <Modal
      title={
        <Title>Select {isOriginToken ? "Origin" : "Destination"} Token</Title>
      }
      isOpen={displayModal}
      padding="thin"
      exitModalHandler={() => setDisplayModal(false)}
      exitOnOutsideClick
      width={720}
      height={800}
      topDivider
      darkBackground
    >
      <InnerWrapper>
        <ChainWrapper>
          <SearchWrapper>
            <Searchbar
              search={chainSearch}
              setSearch={setChainSearch}
              searchTopic="Chain"
            />
          </SearchWrapper>
          <ListWrapper>
            <ChainEntry
              chainId={null}
              isSelected={selectedChain === null}
              onClick={() => setSelectedChain(null)}
            />
            {Object.entries(displayedChains).map(([chainId]) => (
              <ChainEntry
                key={chainId}
                chainId={Number(chainId)}
                isSelected={selectedChain === Number(chainId)}
                onClick={() => setSelectedChain(Number(chainId))}
              />
            ))}
          </ListWrapper>
        </ChainWrapper>
        <VerticalDivider />
        <TokenWrapper>
          <SearchWrapper>
            <Searchbar
              searchTopic="Token"
              search={tokenSearch}
              setSearch={setTokenSearch}
            />
          </SearchWrapper>
          <ListWrapper>
            {displayedTokens.map((token) => (
              <TokenEntry
                key={token.address + token.chainId}
                token={token}
                isSelected={false}
                onClick={() => {
                  onSelect({
                    chainId: token.chainId,
                    symbolUri: token.logoURI,
                    symbol: token.symbol,
                    address: token.address,
                    balance: token.balance,
                    priceUsd: parseUnits(token.priceUSD, 18),
                    decimals: token.decimals,
                  });
                  setDisplayModal(false);
                }}
              />
            ))}
          </ListWrapper>
        </TokenWrapper>
      </InnerWrapper>
    </Modal>
  );
}

const ChainEntry = ({
  chainId,
  isSelected,
  onClick,
}: {
  chainId: number | null;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const chainInfo = chainId
    ? getChainInfo(chainId)
    : {
        logoURI: AllChainsIcon,
        name: "All",
      };
  return (
    <EntryItem isSelected={isSelected} onClick={onClick}>
      <ChainItemImage src={chainInfo.logoURI} alt={chainInfo.name} />
      <ChainItemName>{chainInfo.name}</ChainItemName>
      {isSelected && <ChainItemCheckmark />}
    </EntryItem>
  );
};

const TokenEntry = ({
  token,
  isSelected,
  onClick,
}: {
  token: LifiToken & { balanceUsd: number; balance: BigNumber };
  isSelected: boolean;
  onClick: () => void;
}) => {
  const hasBalance = token.balance.gt(0) && token.balanceUsd > 0.01;
  return (
    <EntryItem isSelected={isSelected} onClick={onClick}>
      <TokenItemImage token={token} />
      <TokenNameSymbolWrapper>
        <TokenName>{token.name}</TokenName>
        <TokenSymbol>{token.symbol}</TokenSymbol>
      </TokenNameSymbolWrapper>
      {hasBalance && (
        <TokenBalanceStack>
          <TokenBalance>
            {formatUnitsWithMaxFractions(
              token.balance.toBigInt(),
              token.decimals
            )}
          </TokenBalance>
          <TokenBalanceUsd>
            ${formatUSD(parseUnits(token.balanceUsd.toString(), 18))}
          </TokenBalanceUsd>
        </TokenBalanceStack>
      )}
    </EntryItem>
  );
};

const TokenItemImage = ({ token }: { token: LifiToken }) => {
  return (
    <TokenItemImageWrapper>
      <TokenItemTokenImage src={token.logoURI} alt={token.name} />
      <TokenItemChainImage
        src={getChainInfo(token.chainId).logoURI}
        alt={getChainInfo(token.chainId).name}
      />
    </TokenItemImageWrapper>
  );
};

const TokenItemImageWrapper = styled.div`
  width: 32px;
  height: 32px;

  flex-shrink: 0;

  position: relative;
`;

const TokenItemTokenImage = styled.img`
  width: 100%;
  height: 100%;

  top: 0;
  left: 0;

  position: absolute;

  mask-image: url(${TokenMask});
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  mask-position: center;
`;

const TokenItemChainImage = styled.img`
  width: 12px;
  height: 12px;

  position: absolute;

  bottom: 0;
  right: 0;
`;

const InnerWrapper = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: row;
  gap: 12px;
`;

const VerticalDivider = styled.div`
  width: 1px;

  height: 400px;

  margin: -16px 0;

  background-color: #3f4247;

  flex-shrink: 0;
`;

const Title = styled.div`
  overflow: hidden;
  color: var(--Base-bright-gray, #e0f3ff);

  font-family: Barlow;
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 26px */
`;

const ChainWrapper = styled.div`
  width: calc(33% - 0.5px);
  height: 100%;

  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TokenWrapper = styled.div`
  width: calc(67% - 0.5px);
  height: 100%;

  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SearchWrapper = styled.div`
  padding: 0px 8px;
`;

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  overflow-y: scroll;
  max-height: 300px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
`;

const EntryItem = styled.div<{ isSelected: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  width: 100%;
  flex-shrink: 0;

  align-items: center;

  padding: 8px;
  height: 48px;
  gap: 8px;

  border-radius: 8px;
  background: ${({ isSelected }) =>
    isSelected ? COLORS["aqua-5"] : "transparent"};

  cursor: pointer;

  transition: background 0.2s ease-in-out;

  &:hover {
    background: ${({ isSelected }) =>
      isSelected ? COLORS["aqua-15"] : COLORS["grey-400-15"]};
  }
`;

const ChainItemImage = styled.img`
  width: 32px;
  height: 32px;

  flex-shrink: 0;
`;

const ChainItemName = styled.div`
  overflow: hidden;
  color: var(--Base-bright-gray, #e0f3ff);
  text-overflow: ellipsis;
  /* Body/Medium */
  font-family: Barlow;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 20.8px */

  width: 100%;
`;

const ChainItemCheckmark = styled(CheckmarkCircle)`
  width: 20px;
  height: 20px;
`;

const TokenNameSymbolWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;

  width: 100%;

  align-items: center;
  justify-content: start;
`;

const TokenName = styled.div`
  overflow: hidden;
  color: var(--Base-bright-gray, #e0f3ff);
  /* Body/Medium */
  font-family: Barlow;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 20.8px */

  max-width: 20ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TokenSymbol = styled.div`
  overflow: hidden;
  color: var(--Base-bright-gray, #e0f3ff);
  text-overflow: ellipsis;
  /* Body/X Small */
  font-family: Barlow;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 15.6px */

  opacity: 0.5;

  text-transform: uppercase;
`;

const TokenBalanceStack = styled.div`
  display: flex;
  flex-direction: column;

  align-items: flex-end;

  gap: 4px;
`;

const TokenBalance = styled.div`
  color: var(--Base-bright-gray, #e0f3ff);
  /* Body/Small */
  font-family: Barlow;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 18.2px */
`;

const TokenBalanceUsd = styled.div`
  color: var(--Base-bright-gray, #e0f3ff);
  /* Body/X Small */
  font-family: Barlow;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 15.6px */
  opacity: 0.5;
`;
