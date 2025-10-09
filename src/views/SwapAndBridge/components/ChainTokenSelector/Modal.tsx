import Modal from "components/Modal";
import { EnrichedTokenSelect } from "./SelectorButton";
import styled from "@emotion/styled";
import { Searchbar } from "./Searchbar";
import TokenMask from "assets/mask/token-mask-corner.svg";
import useAvailableCrosschainRoutes, {
  LifiToken,
} from "hooks/useAvailableCrosschainRoutes";
import {
  CHAIN_IDs,
  ChainInfo,
  COLORS,
  formatUnitsWithMaxFractions,
  formatUSD,
  getChainInfo,
  parseUnits,
  TOKEN_SYMBOLS_MAP,
} from "utils";
import { useMemo, useState, useEffect } from "react";
import { ReactComponent as CheckmarkCircle } from "assets/icons/checkmark-circle.svg";
import { ReactComponent as ChevronRight } from "assets/icons/chevron-right.svg";
import { ReactComponent as SearchResults } from "assets/icons/search_results.svg";
import AllChainsIcon from "assets/chain-logos/all-swap-chain.png";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { BigNumber } from "ethers";
import { Text } from "components";
import { useHotkeys } from "react-hotkeys-hook";

const popularChains = [
  CHAIN_IDs.MAINNET,
  CHAIN_IDs.BASE,
  CHAIN_IDs.UNICHAIN,
  CHAIN_IDs.ARBITRUM,
  CHAIN_IDs.SOLANA,
];

const popularTokens = [
  TOKEN_SYMBOLS_MAP.USDC.symbol,
  TOKEN_SYMBOLS_MAP.USDT.symbol,
  TOKEN_SYMBOLS_MAP.ETH.symbol,
  TOKEN_SYMBOLS_MAP.WETH.symbol,
  TOKEN_SYMBOLS_MAP.WBTC.symbol,
];

type ChainData = ChainInfo & {
  isDisabled: boolean;
};

type DisplayedChains = {
  popular: ChainData[];
  all: ChainData[];
};

type EnrichedToken = LifiToken & {
  balance: BigNumber;
  balanceUsd: number;
  isReachable?: boolean;
  routeSource: "bridge" | "swap";
};

type DisplayedTokens = {
  popular: EnrichedToken[];
  all: EnrichedToken[];
};

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

  const [selectedChain, setSelectedChain] = useState<number | null>(
    popularChains[0]
  );
  const [mobileStep, setMobileStep] = useState<"chain" | "token">("chain");

  const [tokenSearch, setTokenSearch] = useState("");
  const [chainSearch, setChainSearch] = useState("");

  // Reset mobile step when modal opens/closes
  useEffect(() => {
    setMobileStep("chain");
    setChainSearch("");
    setTokenSearch("");
    setSelectedChain(popularChains[0]);
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

    // Filter by search first
    const filteredTokens = enrichedTokens.filter((t) => {
      if (tokenSearch === "") {
        return true;
      }
      if (t.chainId !== selectedChain) {
        return false;
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

    // Separate popular tokens from all tokens
    const popularTokensList = filteredTokens.filter((token) =>
      popularTokens.includes(token.symbol)
    );
    const allTokensList = filteredTokens.filter(
      (token) => !popularTokens.includes(token.symbol)
    );

    // Sort function that prioritizes tokens with balance, then by balance amount, then alphabetically
    const sortTokens = (tokens: EnrichedToken[]) => {
      return tokens.sort((a, b) => {
        // First, sort by disabled status - disabled tokens go to bottom
        const aDisabled = a.isReachable === false;
        const bDisabled = b.isReachable === false;

        if (aDisabled !== bDisabled) {
          return aDisabled ? 1 : -1;
        }

        // Then sort by balance - tokens with balance go to top
        const aHasBalance = a.balance.gt(0) && a.balanceUsd > 0.01;
        const bHasBalance = b.balance.gt(0) && b.balanceUsd > 0.01;

        if (aHasBalance !== bHasBalance) {
          return aHasBalance ? -1 : 1;
        }

        // If both have balance or both don't have balance, sort by balance amount
        if (aHasBalance && bHasBalance) {
          if (Math.abs(b.balanceUsd - a.balanceUsd) < 0.0001) {
            return a.symbol.toLocaleLowerCase().localeCompare(b.symbol);
          }
          return b.balanceUsd - a.balanceUsd;
        }

        // If neither has balance, sort alphabetically
        return a.symbol.toLocaleLowerCase().localeCompare(b.symbol);
      });
    };

    // Sort both sections
    const sortedPopularTokens = sortTokens(popularTokensList);
    const sortedAllTokens = sortTokens(allTokensList);

    return {
      popular: sortedPopularTokens.slice(0, 50), // Limit to 50 popular tokens
      all: sortedAllTokens.slice(0, 50), // Limit to 50 all tokens
    };
  }, [selectedChain, balances, tokenSearch, crossChainRoutes.data]);

  const displayedChains = useMemo(() => {
    const chainsWithDisabledState = Object.keys(crossChainRoutes.data || {})
      .map((chainId) => getChainInfo(Number(chainId)))
      .filter((chainInfo) => {
        // TODO: check why we are filtering out Boba?
        if (chainInfo.chainId === 288) {
          return false;
        }

        const keywords = [
          String(chainInfo.chainId),
          chainInfo.name.toLowerCase().replace(" ", ""),
        ];
        return keywords.some((keyword) =>
          keyword.toLowerCase().includes(chainSearch.toLowerCase())
        );
      })
      .map((chainInfo) => {
        return {
          ...chainInfo,
          isDisabled:
            otherToken && Number(chainInfo.chainId) === otherToken.chainId, // same chain can't be both input and output
        };
      });

    // Separate popular chains from all chains
    const popularChainsData = chainsWithDisabledState
      .filter((chain) => popularChains.includes(chain.chainId))
      .sort((chainA, chainB) => {
        const indexA = popularChains.indexOf(Number(chainA.chainId));
        const indexB = popularChains.indexOf(Number(chainB.chainId));
        return indexA - indexB;
      });

    const allChainsData = chainsWithDisabledState
      .filter((chain) => !popularChains.includes(chain.chainId))
      .sort((chainA, chainB) => {
        const chainInfoA = getChainInfo(Number(chainA.chainId));
        const chainInfoB = getChainInfo(Number(chainB.chainId));
        return chainInfoA.name.localeCompare(chainInfoB.name);
      });

    return {
      popular: popularChainsData,
      all: allChainsData,
    } as DisplayedChains;
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
  displayedChains: DisplayedChains;
  displayedTokens: DisplayedTokens;
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
  displayedChains: DisplayedChains;
  displayedTokens: DisplayedTokens;
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
  displayedChains: DisplayedChains;
  displayedTokens: DisplayedTokens;
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

            {/* Popular Chains Section */}
            {displayedChains.popular.length > 0 && (
              <>
                <SectionHeader>Popular Chains</SectionHeader>
                {displayedChains.popular.map(({ chainId, isDisabled }) => (
                  <ChainEntry
                    key={chainId}
                    chainId={Number(chainId)}
                    isSelected={selectedChain === Number(chainId)}
                    isDisabled={isDisabled}
                    onClick={() => onChainSelect(Number(chainId))}
                  />
                ))}
              </>
            )}

            {/* All Chains Section */}

            {displayedChains.all.length > 0 && (
              <>
                <SectionHeader>All Chains</SectionHeader>
                {displayedChains.all.map(({ chainId, isDisabled }) => (
                  <ChainEntry
                    key={chainId}
                    chainId={Number(chainId)}
                    isSelected={selectedChain === Number(chainId)}
                    isDisabled={isDisabled}
                    onClick={() => onChainSelect(Number(chainId))}
                  />
                ))}
              </>
            )}

            {!displayedChains.all.length &&
              !displayedChains.popular.length &&
              chainSearch && <EmptySearchResults query={chainSearch} />}
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
            {/* Popular Tokens Section */}
            {displayedTokens.popular.length > 0 && (
              <>
                <SectionHeader>Popular Tokens</SectionHeader>
                {displayedTokens.popular.map((token) => (
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
              </>
            )}

            {/* All Tokens Section */}

            {displayedTokens.all.length > 0 && (
              <>
                <SectionHeader>All Tokens</SectionHeader>
                {displayedTokens.all.map((token) => (
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
              </>
            )}
            {!displayedTokens.all.length &&
              !displayedTokens.popular.length &&
              tokenSearch && <EmptySearchResults query={tokenSearch} />}
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
  displayedChains: DisplayedChains;
  displayedTokens: DisplayedTokens;
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedTokenSelect) => void;
  onModalClose: () => void;
}) => {
  useHotkeys("esc", () => onModalClose());
  return (
    <DesktopInnerWrapper>
      <DesktopChainWrapper>
        <SearchBarStyled
          inputProps={{
            tabIndex: 2,
          }}
          search={chainSearch}
          setSearch={setChainSearch}
          searchTopic="Chain"
        />
        <ListWrapper tabIndex={-1}>
          <ChainEntry
            chainId={null}
            isSelected={selectedChain === null}
            onClick={() => onChainSelect(null)}
          />

          {/* Popular Chains Section */}
          {displayedChains.popular.length > 0 && (
            <>
              <SectionHeader>Popular Chains</SectionHeader>
              {displayedChains.popular.map(({ chainId, isDisabled }) => (
                <ChainEntry
                  key={chainId}
                  chainId={Number(chainId)}
                  isSelected={selectedChain === Number(chainId)}
                  isDisabled={isDisabled}
                  onClick={() => onChainSelect(Number(chainId))}
                />
              ))}
            </>
          )}

          {/* All Chains Section */}
          {displayedChains.all.length > 0 && (
            <>
              <SectionHeader>All Chains</SectionHeader>
              {displayedChains.all.map(({ chainId, isDisabled }) => (
                <ChainEntry
                  key={chainId}
                  chainId={Number(chainId)}
                  isSelected={selectedChain === Number(chainId)}
                  isDisabled={isDisabled}
                  onClick={() => onChainSelect(Number(chainId))}
                />
              ))}
            </>
          )}
          {!displayedChains.all.length &&
            !displayedChains.popular.length &&
            chainSearch && <EmptySearchResults query={chainSearch} />}
        </ListWrapper>
      </DesktopChainWrapper>
      <VerticalDivider />
      <DesktopTokenWrapper>
        <SearchBarStyled
          inputProps={{
            tabIndex: 3,
          }}
          searchTopic="Token"
          search={tokenSearch}
          setSearch={setTokenSearch}
        />
        <ListWrapper tabIndex={-1}>
          {/* Popular Tokens Section */}
          {displayedTokens.popular.length > 0 && (
            <>
              <SectionHeader>Popular Tokens</SectionHeader>
              {displayedTokens.popular.map((token) => (
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
            </>
          )}

          {/* All Tokens Section */}
          {displayedTokens.all.length > 0 && (
            <>
              <SectionHeader>All Tokens</SectionHeader>
              {displayedTokens.all.map((token) => (
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
            </>
          )}
          {!displayedTokens.all.length &&
            !displayedTokens.popular.length &&
            tokenSearch && <EmptySearchResults query={tokenSearch} />}
        </ListWrapper>
      </DesktopTokenWrapper>
      <KeyboardShortcutsSection>
        <KeyboardShortcutsTitle>
          Use shortcuts for fast navigation
        </KeyboardShortcutsTitle>
        <KeyboardLegendItem>
          Next item<Key>tab</Key>
        </KeyboardLegendItem>
        <KeyboardLegendItem>
          Select<Key>return</Key>
        </KeyboardLegendItem>
        <KeyboardLegendItem>
          Close<Key>esc</Key>
        </KeyboardLegendItem>
      </KeyboardShortcutsSection>
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

const EmptySearchResults = ({
  className,
  query,
}: {
  query: string;
  className?: string;
}) => {
  return (
    <SearchResultsWrapper className={className}>
      <SearchResults width={88} height={88} />
      <Text>No results for {query}</Text>
    </SearchResultsWrapper>
  );
};

const SearchResultsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  color: white;
  padding: 24px;
`;

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
  flex: 1;
  min-height: 0;
  padding-bottom: calc(56px * 2 + 23px); // account for footer

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

const EntryItem = styled.button<{ isSelected: boolean; isDisabled?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;

  width: 100%;
  flex-shrink: 0;

  align-items: center;

  padding: 8px;
  height: 48px;
  gap: 8px;

  border-radius: 8px;
  border: 2px solid transparent;
  background: ${({ isSelected }) =>
    isSelected ? COLORS["aqua-5"] : "transparent"};

  cursor: ${({ isDisabled }) => (isDisabled ? "not-allowed" : "pointer")};
  opacity: ${({ isDisabled }) => (isDisabled ? 0.5 : 1)};

  &:hover {
    background: ${({ isSelected, isDisabled }) => {
      if (isDisabled) return "transparent";
      return isSelected ? COLORS["aqua-15"] : COLORS["grey-400-15"];
    }};
  }

  :focus-visible {
    outline: none;
    border-color: ${COLORS.aqua};
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
`;

const ChainItemCheckmark = styled(CheckmarkCircle)`
  width: 20px;
  height: 20px;
  margin-left: auto;
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
  margin-left: auto;
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

const SectionHeader = styled.div`
  color: var(--Base-bright-gray, #e0f3ff);
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
  opacity: 0.7;
  padding: 8px 0px 4px 0px;
  letter-spacing: 0.5px;
`;

const KeyboardShortcutsTitle = styled.span`
  margin-right: auto;
`;

const KeyboardShortcutsSection = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 56px;
  width: 100%;
  border-top: 1px solid #34353b;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding-inline: 24px;
  margin-top: auto;
  color: #e0f3ff7f;
  background: #202024;
`;

const KeyboardLegendItem = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Key = styled.div`
  height: 24px;
  border: 1px solid #34353b;
  border-radius: 4px;
  padding-inline: 8px;
  font-size: 14px;
  font-weight: 400;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: rgba(224, 243, 255, 0.4);
`;
