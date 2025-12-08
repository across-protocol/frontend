import styled from "@emotion/styled";
import { useCallback, useEffect, useState } from "react";
import { COLORS, getChainInfo } from "utils";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import { TokenImage } from "components/TokenImage";
import {
  ChainTokenSelectorModal,
  EnrichedToken,
} from "./ChainTokenSelectorModal";
import { getTokenDisplaySymbol } from "hooks/useAvailableCrosschainRoutes";

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

  useEffect(() => {
    if (selectedToken) {
      onSelect?.(selectedToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToken]);

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
        <TokenStack>
          <TokenImg src={selectedToken.logoURI} alt={selectedToken.symbol} />
          <ChainImg src={chain.logoURI} alt={chain.name} />
        </TokenStack>
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
  --padding: 6px;
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

const TokenStack = styled.div`
  height: 100%;
  width: var(--height);
  padding-inline: var(--padding);
  position: relative;
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TokenImg = styled(TokenImage)`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  z-index: 1;
`;

const ChainImg = styled(TokenImage)`
  border-radius: 50%;
  border: 1px solid transparent;
  background: ${COLORS["grey-600"]};
  width: 14px;
  height: 14px;
  position: absolute;
  bottom: 4px;
  left: 34px;
  z-index: 2;
`;

const ChevronDown = styled(ChevronDownIcon)`
  height: 16px;
  width: 16px;
`;
