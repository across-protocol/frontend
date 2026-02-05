import styled from "@emotion/styled";
import { useCallback, useState } from "react";
import { COLORS, getChainInfo } from "utils/constants";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import {
  ChainTokenSelectorModal,
  EnrichedToken,
} from "./ChainTokenSelectorModal";
import { getTokenDisplaySymbol } from "hooks/useAvailableCrosschainRoutes";
import { TokenAndChainLogo } from "./TokenAndChainLogo";

type Props = {
  selectedToken: EnrichedToken | null;
  onSelect?: (token: EnrichedToken) => void;
  onSelectOtherToken?: (token: EnrichedToken | null) => void; // Callback to reset the other selector
  isOriginToken: boolean;
  otherToken?: EnrichedToken | null; // The currently selected token on the other side
  marginBottom?: string;
  className?: string;
};

export default function SelectorButton({
  onSelect,
  onSelectOtherToken,
  selectedToken,
  isOriginToken,
  otherToken,
  className,
}: Props) {
  const [displayModal, setDisplayModal] = useState(false);

  const setSelectedToken = useCallback(
    (token: EnrichedToken) => {
      onSelect?.(token);
      setDisplayModal(false);
    },
    [onSelect]
  );

  if (!selectedToken) {
    return (
      <>
        <Wrapper
          id={`${isOriginToken ? "origin" : "destination"}-token-selector`}
          className={className}
          onClick={() => setDisplayModal(true)}
        >
          <NamesStack>
            <SelectTokenName>Select token</SelectTokenName>
          </NamesStack>
          <VerticalDivider />
          <ChevronStack>
            <ChevronDown />
          </ChevronStack>
        </Wrapper>
        <ChainTokenSelectorModal
          onSelect={setSelectedToken}
          onSelectOtherToken={onSelectOtherToken}
          displayModal={displayModal}
          setDisplayModal={setDisplayModal}
          isOriginToken={isOriginToken}
          currentToken={selectedToken}
          otherToken={otherToken}
        />
      </>
    );
  }

  const chain = getChainInfo(selectedToken.chainId);

  return (
    <>
      <Wrapper
        id={`${isOriginToken ? "origin" : "destination"}-token-selector`}
        className={className}
        onClick={() => setDisplayModal(true)}
      >
        <TokenAndChainLogo
          src={selectedToken.logoURI}
          alt={selectedToken.symbol}
          chain={chain}
        />
        <VerticalDivider />
        <NamesStack>
          <TokenName>{getTokenDisplaySymbol(selectedToken)}</TokenName>
          <ChainName>{chain.name}</ChainName>
        </NamesStack>
        <VerticalDivider />
        <ChevronStack>
          <ChevronDown />
        </ChevronStack>
      </Wrapper>
      <ChainTokenSelectorModal
        onSelect={setSelectedToken}
        onSelectOtherToken={onSelectOtherToken}
        displayModal={displayModal}
        setDisplayModal={setDisplayModal}
        isOriginToken={isOriginToken}
        currentToken={selectedToken}
        otherToken={otherToken}
      />
    </>
  );
}

const Wrapper = styled.button`
  --height: 48px;
  --padding: 8px;
  height: var(--height);
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  border-radius: 12px;
  border: 1px solid rgba(224, 243, 255, 0.05);
  background: rgba(224, 243, 255, 0.05);

  cursor: pointer;

  &:hover {
    background: rgba(224, 243, 255, 0.1);
  }
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: calc(100% - (var(--padding) * 2));
  margin-top: var(--padding);

  background: rgba(224, 243, 255, 0.05);
`;

const ChevronStack = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: var(--height);
`;

const NamesStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-inline: var(--padding);
  white-space: nowrap;
  height: 100%;
  min-width: 72px;

  flex-grow: 1;

  justify-content: center;
  align-items: flex-start;
`;

const TokenName = styled.div`
  font-size: 14px;
  line-height: 100%;
  font-weight: 600;
  color: var(--base-bright-gray, #e0f3ff);
`;

const SelectTokenName = styled(TokenName)`
  color: ${COLORS["aqua"]};
  padding-inline: 8px;
`;

const ChainName = styled.div`
  font-size: 14px;
  font-weight: 400;
  line-height: 100%;
  color: var(--base-bright-gray, #e0f3ff);
  opacity: 0.5;
`;

const ChevronDown = styled(ChevronDownIcon)`
  height: 16px;
  width: 16px;
`;
