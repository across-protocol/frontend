import Modal from "components/Modal";
import styled from "@emotion/styled";
import { Searchbar } from "./Searchbar";
import TokenMask from "assets/mask/token-mask-corner.svg";
import {
  LifiToken,
  getTokenDisplaySymbol,
} from "hooks/useAvailableCrosschainRoutes";
import {
  CHAIN_IDs,
  ChainInfo,
  COLORS,
  formatUnitsWithMaxFractions,
  formatUSD,
  getChainInfo,
  getTokenExplorerLinkFromAddress,
  INDIRECT_CHAINS,
  parseUnits,
  QUERIES,
  TOKEN_SYMBOLS_MAP,
} from "utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAmplitude } from "hooks/useAmplitude";
import { ampli } from "ampli";
import { ReactComponent as CheckmarkCircleFilled } from "assets/icons/checkmark-circle-filled.svg";
import { ReactComponent as ChevronRight } from "assets/icons/chevron-right.svg";
import { ReactComponent as SearchResults } from "assets/icons/search_results.svg";
import { ReactComponent as WarningIcon } from "assets/icons/warning_triangle.svg";
import { ReactComponent as LinkExternalIcon } from "assets/icons/arrow-up-right-boxed.svg";
import AllChainsIcon from "assets/chain-logos/all-swap-chain.png";
import { useEnrichedCrosschainBalances } from "hooks/useEnrichedCrosschainBalances";
import useCurrentBreakpoint from "hooks/useCurrentBreakpoint";
import { BigNumber } from "ethers";
import { Text, TokenImage } from "components";
import { useHotkeys } from "react-hotkeys-hook";
import { getBridgeableSvmTokenFilterPredicate } from "./getBridgeableSvmTokenFilterPredicate";
import { isTokenUnreachable } from "./isTokenUnreachable";

const destinationOnlyChainIds = Object.keys(INDIRECT_CHAINS).map(Number);

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
  "USDT0", // hardcoded symbol while we wait for support in @across-protocol/constants
];

type ChainData = ChainInfo & {
  isDisabled: boolean;
};

type DisplayedChains = {
  popular: ChainData[];
  all: ChainData[];
};

export type EnrichedToken = LifiToken & {
  balance: BigNumber;
  balanceUsd: number;
  routeSource: "bridge" | "swap";
};

type EnrichedTokenWithReachability = EnrichedToken & {
  isUnreachable: boolean;
};

type DisplayedTokens = {
  popular: EnrichedTokenWithReachability[];
  all: EnrichedTokenWithReachability[];
};

type Props = {
  onSelect: (token: EnrichedToken) => void;
  onSelectOtherToken?: (token: EnrichedToken | null) => void; // Callback to reset the other selector
  isOriginToken: boolean;
  currentToken?: EnrichedToken | null; // The currently selected token we're changing from
  otherToken?: EnrichedToken | null; // The currently selected token on the other side
  displayModal: boolean;
  setDisplayModal: (displayModal: boolean) => void;
};

export function ChainTokenSelectorModal({
  isOriginToken,
  displayModal,
  setDisplayModal,
  onSelect,
  onSelectOtherToken,
  currentToken,
  otherToken,
}: Props) {
  const crossChainRoutes = useEnrichedCrosschainBalances();
  const { isMobile } = useCurrentBreakpoint();
  const { addToAmpliQueue } = useAmplitude();

  const [selectedChain, setSelectedChain] = useState<number | null>(
    currentToken?.chainId ?? popularChains[0]
  );
  const [mobileStep, setMobileStep] = useState<"chain" | "token">("chain");

  const [tokenSearch, setTokenSearch] = useState("");
  const [chainSearch, setChainSearch] = useState("");

  const trackChainSelected = useCallback(
    (chainId: number | null) => {
      if (chainId === null) return;
      addToAmpliQueue(() => {
        if (isOriginToken) {
          ampli.originChainSelected({
            action: "onClick",
            chainId: String(chainId),
          });
        } else {
          ampli.destinationChainSelected({
            action: "onClick",
            chainId: String(chainId),
          });
        }
      });
    },
    [addToAmpliQueue, isOriginToken]
  );

  const trackTokenSelected = useCallback(
    (token: EnrichedToken) => {
      addToAmpliQueue(() => {
        if (isOriginToken) {
          ampli.originTokenSelected({
            action: "onClick",
            default: false,
            tokenAddress: token.address,
            tokenChainId: String(token.chainId),
            tokenSymbol: token.symbol,
          });
        } else {
          ampli.destinationTokenSelected({
            action: "onClick",
            default: false,
            tokenAddress: token.address,
            tokenChainId: String(token.chainId),
            tokenSymbol: token.symbol,
          });
        }
      });
    },
    [addToAmpliQueue, isOriginToken]
  );
  // Reset mobile step when modal opens/closes
  useEffect(() => {
    setMobileStep("chain");
    setChainSearch("");
    setTokenSearch("");
    setSelectedChain(currentToken?.chainId ?? popularChains[0]);
  }, [displayModal, currentToken]);

  const displayedTokens = useMemo(() => {
    let tokens = selectedChain ? (crossChainRoutes[selectedChain] ?? []) : [];

    if (tokens.length === 0 && selectedChain === null) {
      tokens = Object.values(crossChainRoutes).flatMap((t) => t);
    }

    // Enrich tokens with route source information and unreachable flag
    const enrichedTokens = tokens.map((token) => {
      // Find the corresponding token in crossChainRoutes to get route source
      const routeToken = crossChainRoutes?.[token.chainId]?.find(
        (rt) => rt.address.toLowerCase() === token.address.toLowerCase()
      );

      const isUnreachable = isTokenUnreachable(
        token,
        isOriginToken,
        otherToken
      );

      return {
        ...token,
        routeSource: routeToken?.routeSource || "bridge", // Default to bridge if not found
        isUnreachable,
      };
    });

    // Filter by search first
    const filteredTokens = enrichedTokens
      .filter((t) => {
        if (tokenSearch === "") {
          return true;
        }

        // When a specific chain is selected, only show tokens from that chain
        if (selectedChain !== null && t.chainId !== selectedChain) {
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
      })
      .filter(getBridgeableSvmTokenFilterPredicate(isOriginToken, otherToken));

    // Sort function that prioritizes tokens with balance, then by balance amount, then alphabetically
    const sortTokens = (tokens: EnrichedTokenWithReachability[]) => {
      return tokens.sort((a, b) => {
        // Sort by token balance - tokens with balance go to top
        const aHasTokenBalance = a.balance.gt(0);
        const bHasTokenBalance = b.balance.gt(0);

        if (aHasTokenBalance !== bHasTokenBalance) {
          return aHasTokenBalance ? -1 : 1;
        }

        // If both have token balance, prioritize sorting by USD value if available
        if (aHasTokenBalance && bHasTokenBalance) {
          const aHasUsdBalance = a.balanceUsd > 0.01;
          const bHasUsdBalance = b.balanceUsd > 0.01;

          // Both have USD values - sort by USD
          if (aHasUsdBalance && bHasUsdBalance) {
            if (Math.abs(b.balanceUsd - a.balanceUsd) < 0.0001) {
              return a.symbol.toLocaleLowerCase().localeCompare(b.symbol);
            }
            return b.balanceUsd - a.balanceUsd;
          }

          // Only one has USD value - prioritize the one with USD
          if (aHasUsdBalance !== bHasUsdBalance) {
            return aHasUsdBalance ? -1 : 1;
          }

          // Neither has USD value - sort alphabetically
          return a.symbol.toLocaleLowerCase().localeCompare(b.symbol);
        }

        // If neither has balance, sort alphabetically
        return a.symbol.toLocaleLowerCase().localeCompare(b.symbol);
      });
    };

    // When "all chains" is selected, don't separate popular tokens
    if (selectedChain === null) {
      const sortedAllTokens = sortTokens(filteredTokens);
      return {
        popular: [], // No popular section for all chains
        all: sortedAllTokens,
      };
    }

    // When a specific chain is selected, separate popular tokens from all tokens
    const popularTokensList = filteredTokens.filter((token) =>
      popularTokens.includes(token.symbol)
    );
    const allTokensList = filteredTokens.filter(
      (token) => !popularTokens.includes(token.symbol)
    );

    // Sort both sections
    const sortedPopularTokens = sortTokens(popularTokensList);
    const sortedAllTokens = sortTokens(allTokensList);

    return {
      popular: sortedPopularTokens,
      all: sortedAllTokens,
    };
  }, [selectedChain, crossChainRoutes, isOriginToken, otherToken, tokenSearch]);

  const displayedChains = useMemo(() => {
    const chainsWithDisabledState = Object.keys(crossChainRoutes || {})
      .map((chainId) => getChainInfo(Number(chainId)))
      .filter((chainInfo) => {
        // TODO: check why we are filtering out Boba?
        if (chainInfo.chainId === 288) {
          return false;
        }

        // Filter out destination-only chains if origin selector
        if (
          isOriginToken &&
          destinationOnlyChainIds.includes(chainInfo.chainId)
        ) {
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
          isDisabled: false, // No longer disable chains at chain level
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
  }, [chainSearch, crossChainRoutes, otherToken, isOriginToken]);

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
        trackChainSelected(chainId);
        setSelectedChain(chainId);
        setMobileStep("token");
      }}
      onTokenSelect={(token) => {
        trackTokenSelected(token);
        onSelect(token);
      }}
      onSelectOtherToken={onSelectOtherToken}
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
      onChainSelect={(chainId) => {
        trackChainSelected(chainId);
        setSelectedChain(chainId);
      }}
      onTokenSelect={(token) => {
        trackTokenSelected(token);
        onSelect(token);
      }}
      onSelectOtherToken={onSelectOtherToken}
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
  onSelectOtherToken,
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
  onTokenSelect: (token: EnrichedToken) => void;
  onSelectOtherToken?: (token: EnrichedToken | null) => void;
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
      noScroll
    >
      <MobileLayout
        isOriginToken={isOriginToken}
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
        onSelectOtherToken={onSelectOtherToken}
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
  onSelectOtherToken,
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
  onTokenSelect: (token: EnrichedToken) => void;
  onSelectOtherToken?: (token: EnrichedToken | null) => void;
}) => {
  return (
    <Modal
      verticalLocation="middle"
      title={
        <Title>Select {isOriginToken ? "Origin" : "Destination"} Token</Title>
      }
      isOpen={displayModal}
      padding="thin"
      exitModalHandler={() => setDisplayModal(false)}
      exitOnOutsideClick
      width={1100}
      height={800}
      titleBorder
      noScroll
      closeButtonTabIndex={99999}
    >
      <DesktopLayout
        isOriginToken={isOriginToken}
        selectedChain={selectedChain}
        chainSearch={chainSearch}
        setChainSearch={setChainSearch}
        tokenSearch={tokenSearch}
        setTokenSearch={setTokenSearch}
        displayedChains={displayedChains}
        displayedTokens={displayedTokens}
        onChainSelect={onChainSelect}
        onTokenSelect={onTokenSelect}
        onSelectOtherToken={onSelectOtherToken}
        onModalClose={() => setDisplayModal(false)}
      />
    </Modal>
  );
};

// Mobile Layout Component - 2-step process
const MobileLayout = ({
  isOriginToken,
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
  onSelectOtherToken,
  onModalClose,
}: {
  isOriginToken: boolean;
  mobileStep: "chain" | "token";
  selectedChain: number | null;
  chainSearch: string;
  setChainSearch: (search: string) => void;
  tokenSearch: string;
  setTokenSearch: (search: string) => void;
  displayedChains: DisplayedChains;
  displayedTokens: DisplayedTokens;
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedToken) => void;
  onSelectOtherToken?: (token: EnrichedToken | null) => void;
  onModalClose: () => void;
}) => {
  const chainSearchInputRef = useRef<HTMLInputElement>(null);
  const tokenSearchInputRef = useRef<HTMLInputElement>(null);

  // Focus chain search input when modal opens or when navigating back to chain step
  useEffect(() => {
    if (mobileStep === "chain") {
      chainSearchInputRef.current?.focus();
    } else if (mobileStep === "token") {
      tokenSearchInputRef.current?.focus();
    }
  }, [mobileStep]);

  const warningMessage = "No Route";

  return (
    <MobileInnerWrapper>
      {mobileStep === "chain" ? (
        // Step 1: Chain Selection
        <MobileChainWrapper>
          <SearchBarStyled
            ref={chainSearchInputRef}
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
                    warningMessage={warningMessage}
                    onClick={() => {
                      if (token.isUnreachable && onSelectOtherToken) {
                        onSelectOtherToken(null);
                      }
                      onTokenSelect(token);
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
                    warningMessage={warningMessage}
                    onClick={() => {
                      if (token.isUnreachable && onSelectOtherToken) {
                        onSelectOtherToken(null);
                      }
                      onTokenSelect(token);
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
  isOriginToken,
  selectedChain,
  chainSearch,
  setChainSearch,
  tokenSearch,
  setTokenSearch,
  displayedChains,
  displayedTokens,
  onChainSelect,
  onTokenSelect,
  onSelectOtherToken,
  onModalClose,
}: {
  isOriginToken: boolean;
  selectedChain: number | null;
  chainSearch: string;
  setChainSearch: (search: string) => void;
  tokenSearch: string;
  setTokenSearch: (search: string) => void;
  displayedChains: DisplayedChains;
  displayedTokens: DisplayedTokens;
  onChainSelect: (chainId: number | null) => void;
  onTokenSelect: (token: EnrichedToken) => void;
  onSelectOtherToken?: (token: EnrichedToken | null) => void;
  onModalClose: () => void;
}) => {
  const chainSearchInputRef = useRef<HTMLInputElement>(null);
  const tokenSearchInputRef = useRef<HTMLInputElement>(null);
  useHotkeys("esc", () => onModalClose(), { enableOnFormTags: true });

  // Focus chain search input when component mounts
  useEffect(() => {
    chainSearchInputRef.current?.focus();
  }, []);

  function handleSelectChain(chainId: number | null): void {
    onChainSelect(chainId);
    tokenSearchInputRef.current?.focus();
  }

  const warningMessage = isOriginToken
    ? "Output token will be reset"
    : "Input token will be reset";

  /**
   * Tab order strategy for keyboard navigation:
   * - Chain search: tabIndex 1 (always focused first)
   * - Chain items: tabIndex 2-9999 range
   *   - "All Chains" entry: 2
   *   - Popular chains: 3+
   *   - All chains: follow after popular
   * - Token search: tabIndex 10000
   * - Token items: tabIndex 10001+ range
   *   - Popular tokens: 10001+
   *   - All tokens: follow after popular
   * - Close button: tabIndex 99999 (always last)
   */
  return (
    <DesktopInnerWrapper>
      <DesktopChainWrapper>
        <SearchBarStyled
          ref={chainSearchInputRef}
          inputProps={{
            tabIndex: 1,
          }}
          search={chainSearch}
          setSearch={setChainSearch}
          searchTopic="Chain"
        />
        <ListWrapper tabIndex={-1}>
          <ChainEntry
            chainId={null}
            isSelected={selectedChain === null}
            onClick={() => handleSelectChain(null)}
            tabIndex={2}
          />

          {/* Popular Chains Section */}
          {displayedChains.popular.length > 0 && (
            <>
              <SectionHeader>Popular Chains</SectionHeader>
              {displayedChains.popular.map(({ chainId, isDisabled }, index) => (
                <ChainEntry
                  key={chainId}
                  chainId={chainId}
                  isSelected={selectedChain === chainId}
                  isDisabled={isDisabled}
                  onClick={() => handleSelectChain(chainId)}
                  tabIndex={3 + index}
                />
              ))}
            </>
          )}

          {/* All Chains Section */}
          {displayedChains.all.length > 0 && (
            <>
              <SectionHeader>All Chains</SectionHeader>
              {displayedChains.all.map(({ chainId, isDisabled }, index) => (
                <ChainEntry
                  key={chainId}
                  chainId={chainId}
                  isSelected={selectedChain === chainId}
                  isDisabled={isDisabled}
                  onClick={() => handleSelectChain(chainId)}
                  tabIndex={3 + displayedChains.popular.length + index}
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
            tabIndex: 10000,
          }}
          ref={tokenSearchInputRef}
          searchTopic="Token"
          search={tokenSearch}
          setSearch={setTokenSearch}
        />
        <ListWrapper tabIndex={-1}>
          {/* Popular Tokens Section */}
          {displayedTokens.popular.length > 0 && (
            <>
              <SectionHeader>Popular Tokens</SectionHeader>
              {displayedTokens.popular.map((token, index) => (
                <TokenEntry
                  key={token.address + token.chainId}
                  token={token}
                  isSelected={false}
                  warningMessage={warningMessage}
                  onClick={() => {
                    if (token.isUnreachable && onSelectOtherToken) {
                      onSelectOtherToken(null);
                    }
                    onTokenSelect(token);
                    onModalClose();
                  }}
                  tabIndex={10001 + index}
                />
              ))}
            </>
          )}

          {/* All Tokens Section */}
          {displayedTokens.all.length > 0 && (
            <>
              <SectionHeader>All Tokens</SectionHeader>
              {displayedTokens.all.map((token, index) => (
                <TokenEntry
                  key={token.address + token.chainId}
                  token={token}
                  isSelected={false}
                  warningMessage={warningMessage}
                  onClick={() => {
                    if (token.isUnreachable && onSelectOtherToken) {
                      onSelectOtherToken(null);
                    }
                    onTokenSelect(token);
                    onModalClose();
                  }}
                  tabIndex={10001 + displayedTokens.popular.length + index}
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
  tabIndex,
}: {
  chainId: number | null;
  isSelected: boolean;
  onClick: () => void;
  isDisabled?: boolean;
  tabIndex?: number;
}) => {
  const chainInfo = chainId
    ? getChainInfo(chainId)
    : {
        logoURI: AllChainsIcon,
        name: "All",
      };
  return (
    <ChainEntryItem
      isSelected={isSelected}
      isDisabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      tabIndex={tabIndex}
    >
      <ChainItemImage src={chainInfo.logoURI} alt={chainInfo.name} />
      <ChainItemName>{chainInfo.name}</ChainItemName>
      {isSelected && <ChainItemCheckmark />}
    </ChainEntryItem>
  );
};

const TokenEntry = ({
  token,
  isSelected,
  onClick,
  tabIndex,
  warningMessage,
}: {
  token: EnrichedTokenWithReachability;
  isSelected: boolean;
  onClick: () => void;
  warningMessage: string;
  tabIndex?: number;
}) => {
  const hasTokenBalance = token.balance.gt(0);
  const hasUsdBalance = token.balanceUsd >= 0.01;

  return (
    <TokenEntryItem
      isSelected={isSelected}
      isDisabled={false}
      onClick={onClick}
      tabIndex={tabIndex}
    >
      <TokenInfoWrapper dim={token.isUnreachable}>
        <TokenItemImage token={token} />
        <TokenNameSymbolWrapper>
          <TokenName>
            <span>{token.name}</span>
            <TokenLink
              href={getTokenExplorerLinkFromAddress(
                token.chainId,
                token.address
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {getTokenDisplaySymbol(token)}
              <LinkExternalIcon />
            </TokenLink>
          </TokenName>
          <TokenSymbol>{getChainInfo(token.chainId).name}</TokenSymbol>
        </TokenNameSymbolWrapper>
      </TokenInfoWrapper>

      {token.isUnreachable ? (
        <UnreachableWarning>
          <WarningIcon width="14px" height="14px" color="inherit" />{" "}
          {warningMessage}
        </UnreachableWarning>
      ) : (
        <div />
      )}

      {hasTokenBalance ? (
        <TokenBalanceStack dim={token.isUnreachable}>
          <TokenBalance>
            {formatUnitsWithMaxFractions(
              token.balance.toBigInt(),
              token.decimals
            )}
          </TokenBalance>

          <TokenBalanceUsd>
            {hasUsdBalance
              ? "$" + formatUSD(parseUnits(token.balanceUsd.toString(), 18))
              : "-"}
          </TokenBalanceUsd>
        </TokenBalanceStack>
      ) : (
        <div />
      )}
    </TokenEntryItem>
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

const TokenInfoWrapper = styled.div<{ dim?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: 100%;
  align-items: center;
  gap: 8px;

  opacity: ${({ dim }) => (dim ? 0.5 : 1)};
`;

const TokenItemImageWrapper = styled.div`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  position: relative;
`;

const TokenItemTokenImage = styled(TokenImage)`
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

const TokenItemChainImage = styled(TokenImage)`
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
  color: var(--base-bright-gray, #e0f3ff);
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
  color: var(--base-bright-gray, #e0f3ff);
  font-family: Barlow;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 26px */
  padding-left: 8px;

  ${QUERIES.tabletAndUp} {
    font-size: 20px;
  }
`;

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-bottom: calc(
    56px * 2 + 52px
  ); // account for  (56px - shortcuts footer)

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

const ChainEntryItem = EntryItem;

const TokenEntryItem = styled(EntryItem)`
  display: grid;
  grid-template-columns: 3fr 2fr 1fr; // [TOKEN_INFO - WARNING - BALANCE]
  gap: 8px;
  align-items: center;
`;

const ChainItemImage = styled.img`
  width: 32px;
  height: 32px;
  flex-shrink: 0;
`;

const ChainItemName = styled.div`
  overflow: hidden;
  color: var(--base-bright-gray, #e0f3ff);
  text-overflow: ellipsis;
  /* Body/Medium */
  font-family: Barlow;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 130%; /* 20.8px */
`;

const ChainItemCheckmark = styled(CheckmarkCircleFilled)`
  width: 20px;
  height: 20px;
  margin-left: auto;
`;

const TokenNameSymbolWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  align-items: flex-start;
  justify-content: start;
`;

const TokenSymbol = styled.div`
  overflow: hidden;
  color: var(--base-bright-gray, #e0f3ff);
  text-overflow: ellipsis;
  /* Body/X Small */
  font-family: Barlow;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 15.6px */

  opacity: 0.5;
`;

const TokenBalanceStack = styled.div<{ dim?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  opacity: ${({ dim }) => (dim ? 0.5 : 1)};
`;

const TokenBalance = styled.div`
  color: var(--base-bright-gray, #e0f3ff);
  /* Body/Small */
  font-family: Barlow;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 18.2px */
`;

const TokenBalanceUsd = styled.div`
  color: var(--base-bright-gray, #e0f3ff);
  /* Body/X Small */
  font-family: Barlow;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%; /* 15.6px */
  opacity: 0.5;
`;

const UnreachableWarning = styled.div`
  color: var(--functional-red);
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 130%;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`;

const SectionHeader = styled.div`
  color: var(--base-bright-gray, #e0f3ff);
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

const TokenName = styled.div`
  overflow: hidden;
  color: var(--base-bright-gray, #e0f3ff);
  /* Body/Medium */
  font-family: Barlow;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 130%; /* 20.8px */

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
`;

const TokenLink = styled.a`
  display: inline-flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  text-decoration: none;
  color: var(--base-bright-gray, #e0f3ff);
  opacity: 0.5;
  font-weight: 400;

  svg,
  span {
    font-size: 14px;
    display: none;
    color: inherit;
  }

  &:hover {
    text-decoration: underline;
    color: ${COLORS.aqua};
    opacity: 1;
  }

  &:hover {
    svg {
      display: inline;
    }
  }
`;
