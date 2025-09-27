import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { COLORS, getChainInfo } from "utils";
import { ReactComponent as ChevronDownIcon } from "assets/icons/chevron-down.svg";
import ChainTokenSelectorModal from "./Modal";

export type TokenSelect = {
  chainId: number;
  symbolUri: string;
  symbol: string;
  address: string;
};

export type EnrichedTokenSelect = TokenSelect & {
  priceUsd: BigNumber;
  balance: BigNumber;
  decimals: number;
};

type Props = {
  selectedToken: EnrichedTokenSelect | null;
  onSelect?: (token: EnrichedTokenSelect) => void;
  isOriginToken: boolean;
  marginBottom?: string;
  className?: string;
};

export default function SelectorButton({
  onSelect,
  selectedToken,
  isOriginToken,
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
    (token: EnrichedTokenSelect) => {
      onSelect?.(token);
      setDisplayModal(false);
    },
    [onSelect]
  );

  if (!selectedToken) {
    return (
      <>
        <Wrapper className={className} onClick={() => setDisplayModal(true)}>
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
          displayModal={displayModal}
          setDisplayModal={setDisplayModal}
          isOriginToken={isOriginToken}
        />
      </>
    );
  }

  const chain = getChainInfo(selectedToken.chainId);

  return (
    <>
      <Wrapper className={className} onClick={() => setDisplayModal(true)}>
        <TokenStack>
          <TokenImg src={selectedToken.symbolUri} />
          <ChainImg src={chain.logoURI} />
        </TokenStack>
        <VerticalDivider />
        <NamesStack>
          <TokenName>{selectedToken.symbol}</TokenName>
          <ChainName>{chain.name}</ChainName>
        </NamesStack>
        <VerticalDivider />
        <ChevronStack>
          <ChevronDown />
        </ChevronStack>
      </Wrapper>
      <ChainTokenSelectorModal
        onSelect={setSelectedToken}
        displayModal={displayModal}
        setDisplayModal={setDisplayModal}
        isOriginToken={isOriginToken}
      />
    </>
  );
}

const Wrapper = styled.div`
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

  flex-grow: 1;

  justify-content: center;
  align-items: flex-start;
`;

const TokenName = styled.div`
  font-size: 16px;
  line-height: 16px;

  font-weight: 600;
  color: #e0f3ff;
`;

const SelectTokenName = styled(TokenName)`
  color: ${COLORS["aqua"]};
  padding-inline: 8px;
`;

const ChainName = styled.div`
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
  color: #e0f3ff;
  opacity: 0.5;
`;

const TokenStack = styled.div`
  height: 100%;
  width: var(--height);
  padding-inline: var(--padding);
  position: relative;
  flex-grow: 0;
`;

const TokenImg = styled.img`
  border-radius: 50%;
  position: absolute;
  top: var(--padding);
  left: var(--padding);
  width: calc(var(--height) * 0.66);
  height: calc(var(--height) * 0.66);
  z-index: 1;
`;

const ChainImg = styled.img`
  border-radius: 50%;
  border: 1px solid transparent;
  background: ${COLORS["grey-600"]};
  position: absolute;
  bottom: calc(var(--padding) / 2);
  right: calc(var(--padding) / 2);
  width: 30%;
  height: 30%;
  z-index: 2;
`;

const ChevronDown = styled(ChevronDownIcon)`
  height: 16px;
  width: 16px;
`;
