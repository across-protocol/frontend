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
import { useMemo, useState, useEffect } from "react";
import { ReactComponent as CheckmarkCircle } from "assets/icons/checkmark-circle.svg";
import { ReactComponent as ChevronRight } from "assets/icons/chevron-right.svg";
import AllChainsIcon from "assets/chain-logos/all-swap-chain.png";
import useEnrichedCrosschainBalances from "hooks/useEnrichedCrosschainBalances";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { BigNumber } from "ethers";

type Props = {
  onSelect: (token: EnrichedTokenSelect) => void;
  isOriginToken: boolean;
  otherToken?: EnrichedTokenSelect | null; // The currently selected token on the other side

  displayModal: boolean;
  setDisplayModal: (displayModal: boolean) => void;
};

export default function ChainTokenSelectorModal({
  isOriginToken,
  displayModal,
  setDisplayModal,
  onSelect,
  otherToken,
}: Props) {
  const balances = useEnrichedCrosschainBalances();
  const { isMobile } = useCurrentBreakpoint();

  const crossChainRoutes = useAvailableCrosschainRoutes(
    otherToken
      ? {
          [isOriginToken ? "outputToken" : "inputToken"]: {
            chainId: otherToken.chainId,
            address: otherToken.address,
            symbol: otherToken.symbol,
          },
        }
      : undefined
  );

  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [mobileStep, setMobileStep] = useState<"chain" | "token">("chain");

  const [tokenSearch, setTokenSearch] = useState("");
  const [chainSearch, setChainSearch] = useState("");

  // Reset mobile step when modal opens/closes
  useEffect(() => {
    if (displayModal) {
      setMobileStep("chain");
      setSelectedChain(null);
    }
  }, [displayModal]);

  const displayedTokens = useMemo(() => {
    let tokens = selectedChain ? (balances[selectedChain] ?? []) : [];

    if (tokens.length === 0 && selectedChain === null) {
      tokens = Object.values(balances).flatMap((t) => t);
    }

    // Enrich tokens with reachability information from the hook
    const enrichedTokens = tokens.map((token) => {
      // Find the corresponding token in crossChainRoutes to check isReachable
      const routeToken = crossChainRoutes.data?.[token.chainId]?.find(
        (rt) => rt.address.toLowerCase() === token.address.toLowerCase()
      );

      // Determine if token should be disabled based on new requirements:
      // Only disable tokens if the token is NOT a swap token AND it is not reachable via a bridge route
      let shouldDisable = false;
      if (routeToken) {
        // If it's a swap token, never disable it
        if (routeToken.routeSource === "swap") {
          shouldDisable = false;
        } else {
          // If it's not a swap token, disable it only if it's not reachable via bridge
          shouldDisable = routeToken.isReachable === false;
        }
      } else {
        // If no route token found, disable it (not available for any routes)
        shouldDisable = true;
      }

      return {
        ...token,
        isReachable: !shouldDisable,
        routeSource: routeToken?.routeSource || "bridge", // Default to bridge if not found
      };
    });

    // Return ordering top 100 tokens ordering highest balanceUsd to lowest (fallback alphabetical)
    // Push disabled tokens to the bottom
    const sortedTokens = enrichedTokens.slice(0, 100).sort((a, b) => {
      // First, sort by disabled status - disabled tokens go to bottom
      const aDisabled = a.isReachable === false;
      const bDisabled = b.isReachable === false;

      if (aDisabled !== bDisabled) {
        return aDisabled ? 1 : -1;
      }

      // Then sort by balance (for enabled tokens) or alphabetically (for disabled tokens)
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
  }, [selectedChain, balances, tokenSearch, otherToken, crossChainRoutes.data]);

  const displayedChains = useMemo(() => {
    const chainsWithDisabledState = Object.entries(crossChainRoutes.data || {})
      .filter(([chainId]) => {
        // why ar we filtering out Boba?
        if ([288].includes(Number(chainId))) {
          return false;
        }

        // Filter out the chain of the other token (same chain can't be both input and output)
        if (otherToken && Number(chainId) === otherToken.chainId) {
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
      .map(([chainId, tokens]) => {
        // Never disable chains - requirement 1
        const isDisabled = false;

        return [chainId, { tokens, isDisabled }];
      })
      // Sort chains alphabetically by name (no need to sort by disabled status since none are disabled)
      .sort(([chainIdA], [chainIdB]) => {
        const chainInfoA = getChainInfo(Number(chainIdA));
        const chainInfoB = getChainInfo(Number(chainIdB));
        return chainInfoA.name.localeCompare(chainInfoB.name);
      });

    return Object.fromEntries(chainsWithDisabledState);
  }, [chainSearch, crossChainRoutes.data, otherToken]);

  return isMobile ? (
    <MobileModal
      isOriginToken={isOriginToken}
      displayModal={displayModal}
      setDisplayModal={setDisplayModal}
      mobileStep={mobileStep}
      setMobileStep={setMobileStep}
      selectedChain={selectedChain}
      chainSearch={chainSearch}
      setChainSearch={setChainSearch}
      tokenSearch={tokenSearch}
      setTokenSearch={setTokenSearch}
      displayedChains={displayedChains}
      displayedTokens={displayedTokens}
      onChainSelect={(chainId) => {
        setSelectedChain(chainId);
        setMobileStep("token");
      }}
      onTokenSelect={onSelect}
    />
  ) : (
    <DesktopModal
      isOriginToken={isOriginToken}
      displayModal={displayModal}
      setDisplayModal={setDisplayModal}
      selectedChain={selectedChain}
      chainSearch={chainSearch}
      setChainSearch={setChainSearch}
      tokenSearch={tokenSearch}
      setTokenSearch={setTokenSearch}
      displayedChains={displayedChains}
      displayedTokens={displayedTokens}
      onChainSelect={setSelectedChain}
      onTokenSelect={onSelect}
    />
  );
}

// Mobile Modal Component
const MobileModal = ({
  isOriginToken,
  displayModal,
  setDisplayModal,
  mobileStep,
  setMobileStep,
  selectedChain,
  chainSearch,
  setChainSearch,
  tokenSearch,
  setTokenSearch,
  displayedChains,
  displayedTokens,
  onChainSelect,
  onTokenSelect,
}: {
  isOriginToken: boolean;
  displayModal: boolean;
  setDisplayModal: (display: boolean) => void;
  mobileStep: "chain" | "token";
  setMobileStep: (step: "chain" | "token") => void;
  selectedChain: number | null;
  chainSearch: string;
  setChainSearch: (search: string) => void;
  tokenSearch: string;
  setTokenSearch: (search: string) => void;
  displayedChains: any;
  displayedTokens: any[];
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedTokenSelect) => void;
}) => {
  return (
    <Modal
      verticalLocation="bottom"
      title={
        <TitleWrapper>
          {mobileStep === "token" && (
            <BackButton
              onClick={() => {
                setMobileStep("chain");
                setTokenSearch(""); // Clear token search when going back
              }}
            >
              <ChevronRight />
            </BackButton>
          )}
          <Title>
            {mobileStep === "chain"
              ? `Select ${isOriginToken ? "Origin" : "Destination"} Chain`
              : `Select ${isOriginToken ? "Origin" : "Destination"} Token`}
          </Title>
        </TitleWrapper>
      }
      isOpen={displayModal}
      padding="thin"
      exitModalHandler={() => setDisplayModal(false)}
      exitOnOutsideClick
      width={400}
      height={600}
      titleBorder
    >
      <MobileLayout
        mobileStep={mobileStep}
        selectedChain={selectedChain}
        chainSearch={chainSearch}
        setChainSearch={setChainSearch}
        tokenSearch={tokenSearch}
        setTokenSearch={setTokenSearch}
        displayedChains={displayedChains}
        displayedTokens={displayedTokens}
        onChainSelect={onChainSelect}
        onTokenSelect={onTokenSelect}
        onModalClose={() => setDisplayModal(false)}
      />
    </Modal>
  );
};

// Desktop Modal Component
const DesktopModal = ({
  isOriginToken,
  displayModal,
  setDisplayModal,
  selectedChain,
  chainSearch,
  setChainSearch,
  tokenSearch,
  setTokenSearch,
  displayedChains,
  displayedTokens,
  onChainSelect,
  onTokenSelect,
}: {
  isOriginToken: boolean;
  displayModal: boolean;
  setDisplayModal: (display: boolean) => void;
  selectedChain: number | null;
  chainSearch: string;
  setChainSearch: (search: string) => void;
  tokenSearch: string;
  setTokenSearch: (search: string) => void;
  displayedChains: any;
  displayedTokens: any[];
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedTokenSelect) => void;
}) => {
  return (
    <Modal
      verticalLocation="middle"
      title={`Select ${isOriginToken ? "Origin" : "Destination"} Token`}
      isOpen={displayModal}
      padding="thin"
      exitModalHandler={() => setDisplayModal(false)}
      exitOnOutsideClick
      width={1100}
      height={800}
      titleBorder
    >
      <DesktopLayout
        selectedChain={selectedChain}
        chainSearch={chainSearch}
        setChainSearch={setChainSearch}
        tokenSearch={tokenSearch}
        setTokenSearch={setTokenSearch}
        displayedChains={displayedChains}
        displayedTokens={displayedTokens}
        onChainSelect={onChainSelect}
        onTokenSelect={onTokenSelect}
        onModalClose={() => setDisplayModal(false)}
      />
    </Modal>
  );
};

// Mobile Layout Component - 2-step process
const MobileLayout = ({
  mobileStep,
  selectedChain,
  chainSearch,
  setChainSearch,
  tokenSearch,
  setTokenSearch,
  displayedChains,
  displayedTokens,
  onChainSelect,
  onTokenSelect,
  onModalClose,
}: {
  mobileStep: "chain" | "token";
  selectedChain: number | null;
  chainSearch: string;
  setChainSearch: (search: string) => void;
  tokenSearch: string;
  setTokenSearch: (search: string) => void;
  displayedChains: any;
  displayedTokens: any[];
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedTokenSelect) => void;
  onModalClose: () => void;
}) => {
  return (
    <MobileInnerWrapper>
      {mobileStep === "chain" ? (
        // Step 1: Chain Selection
        <MobileChainWrapper>
          <SearchBarStyled
            search={chainSearch}
            setSearch={setChainSearch}
            searchTopic="Chain"
          />
          <ListWrapper>
            <ChainEntry
              chainId={null}
              isSelected={selectedChain === null}
              onClick={() => onChainSelect(null)}
            />
            {Object.entries(displayedChains).map(([chainId, chainData]) => (
              <ChainEntry
                key={chainId}
                chainId={Number(chainId)}
                isSelected={selectedChain === Number(chainId)}
                isDisabled={
                  (chainData as { tokens: any; isDisabled: boolean }).isDisabled
                }
                onClick={() => onChainSelect(Number(chainId))}
              />
            ))}
          </ListWrapper>
        </MobileChainWrapper>
      ) : (
        // Step 2: Token Selection
        <MobileTokenWrapper>
          <SearchBarStyled
            searchTopic="Token"
            search={tokenSearch}
            setSearch={setTokenSearch}
          />
          <ListWrapper>
            {displayedTokens.map((token) => (
              <TokenEntry
                key={token.address + token.chainId}
                token={token}
                isSelected={false}
                onClick={() => {
                  onTokenSelect({
                    chainId: token.chainId,
                    symbolUri: token.logoURI,
                    symbol: token.symbol,
                    address: token.address,
                    balance: token.balance,
                    priceUsd: parseUnits(token.priceUSD, 18),
                    decimals: token.decimals,
                  });
                  onModalClose();
                }}
              />
            ))}
          </ListWrapper>
        </MobileTokenWrapper>
      )}
    </MobileInnerWrapper>
  );
};

// Desktop Layout Component - Side-by-side columns
const DesktopLayout = ({
  selectedChain,
  chainSearch,
  setChainSearch,
  tokenSearch,
  setTokenSearch,
  displayedChains,
  displayedTokens,
  onChainSelect,
  onTokenSelect,
  onModalClose,
}: {
  selectedChain: number | null;
  chainSearch: string;
  setChainSearch: (search: string) => void;
  tokenSearch: string;
  setTokenSearch: (search: string) => void;
  displayedChains: any;
  displayedTokens: any[];
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedTokenSelect) => void;
  onModalClose: () => void;
}) => {
  return (
    <DesktopInnerWrapper>
      <DesktopChainWrapper>
        <SearchBarStyled
          search={chainSearch}
          setSearch={setChainSearch}
          searchTopic="Chain"
        />
        <ListWrapper>
          <ChainEntry
            chainId={null}
            isSelected={selectedChain === null}
            onClick={() => onChainSelect(null)}
          />
          {Object.entries(displayedChains).map(([chainId, chainData]) => (
            <ChainEntry
              key={chainId}
              chainId={Number(chainId)}
              isSelected={selectedChain === Number(chainId)}
              isDisabled={
                (chainData as { tokens: any; isDisabled: boolean }).isDisabled
              }
              onClick={() => onChainSelect(Number(chainId))}
            />
          ))}
        </ListWrapper>
      </DesktopChainWrapper>
      <VerticalDivider />
      <DesktopTokenWrapper>
        <SearchBarStyled
          searchTopic="Token"
          search={tokenSearch}
          setSearch={setTokenSearch}
        />
        <ListWrapper>
          {displayedTokens.map((token) => (
            <TokenEntry
              key={token.address + token.chainId}
              token={token}
              isSelected={false}
              onClick={() => {
                onTokenSelect({
                  chainId: token.chainId,
                  symbolUri: token.logoURI,
                  symbol: token.symbol,
                  address: token.address,
                  balance: token.balance,
                  priceUsd: parseUnits(token.priceUSD, 18),
                  decimals: token.decimals,
                });
                onModalClose();
              }}
            />
          ))}
        </ListWrapper>
      </DesktopTokenWrapper>
    </DesktopInnerWrapper>
  );
};

const ChainEntry = ({
  chainId,
  isSelected,
  onClick,
  isDisabled = false,
}: {
  chainId: number | null;
  isSelected: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}) => {
  const chainInfo = chainId
    ? getChainInfo(chainId)
    : {
        logoURI: AllChainsIcon,
        name: "All",
      };
  return (
    <EntryItem
      isSelected={isSelected}
      isDisabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
    >
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
  const isDisabled = token.isReachable === false;

  return (
    <EntryItem
      isSelected={isSelected}
      isDisabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
    >
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

const SearchBarStyled = styled(Searchbar)`
  flex-shrink: 0;
`;

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

// Mobile Layout Styled Components
const MobileInnerWrapper = styled.div`
  width: 100%;
  height: 600px; /* Constrain height to enable scrolling */
  display: flex;
  flex-direction: column;
`;

const MobileChainWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
`;

const MobileTokenWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
`;

// Desktop Layout Styled Components
const DesktopInnerWrapper = styled.div`
  width: 100%;
  height: 800px;
  display: flex;
  flex-direction: row;
  gap: 12px;
`;

const DesktopChainWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  min-width: 230px;
`;

const DesktopTokenWrapper = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
`;

const VerticalDivider = styled.div`
  width: 1px;
  margin: -16px 0;
  background-color: #3f4247;
  flex-shrink: 0;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--Base-bright-gray, #e0f3ff);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease-in-out;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
    transform: rotate(180deg); /* Rotate chevron-right to make it point left */
  }
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

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1; /* Take up remaining space in parent */
  min-height: 0; /* Allow flex child to shrink below content size */

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

const EntryItem = styled.div<{ isSelected: boolean; isDisabled?: boolean }>`
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

  cursor: ${({ isDisabled }) => (isDisabled ? "not-allowed" : "pointer")};
  opacity: ${({ isDisabled }) => (isDisabled ? 0.5 : 1)};

  transition:
    background 0.2s ease-in-out,
    opacity 0.2s ease-in-out;

  &:hover {
    background: ${({ isSelected, isDisabled }) => {
      if (isDisabled) return "transparent";
      return isSelected ? COLORS["aqua-15"] : COLORS["grey-400-15"];
    }};
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
