import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { COLORS, getChainInfo } from "utils";
import TokenMask from "assets/mask/token-mask.svg";
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
  defaultToken?: TokenSelect;
  onSelect?: (token: EnrichedTokenSelect) => void;
  isOriginToken: boolean;
  marginBottom?: string;
};

export default function SelectorButton({
  defaultToken,
  onSelect,
  isOriginToken,
  marginBottom,
}: Props) {
  const [selectedToken, _setSelectedToken] = useState<TokenSelect | null>(null);
  const [displayModal, setDisplayModal] = useState(false);

  useEffect(() => {
    if (defaultToken && !selectedToken) {
      _setSelectedToken(defaultToken);
    }
  }, [defaultToken, selectedToken]);

  const setSelectedToken = useCallback(
    (token: EnrichedTokenSelect) => {
      _setSelectedToken(token);
      onSelect?.(token);
      setDisplayModal(false);
    },
    [onSelect]
  );

  if (!selectedToken) {
    return (
      <>
        <SelectWrapper
          onClick={() => setDisplayModal(true)}
          marginBottom={marginBottom}
        >
          <NamesStack>
            <SelectTokenName>Select a token</SelectTokenName>
          </NamesStack>
          <VerticalDivider />
          <ChevronStack>
            <ChevronDown />
          </ChevronStack>
        </SelectWrapper>
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
      <Wrapper
        onClick={() => setDisplayModal(true)}
        marginBottom={marginBottom}
      >
        <TokenStack>
          <TokenImg src={selectedToken.symbolUri} />
          <ChainImg src={chain.logoURI} />
        </TokenStack>
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

const Wrapper = styled.div<{ marginBottom?: string }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${({ marginBottom }) => marginBottom || "0"};

  border-radius: 8px;
  border: 1px solid #3f4247;
  background: #e0f3ff0d;
  padding: 8px 12px;

  height: 64px;

  gap: 12px;
  width: 184px;

  cursor: pointer;
`;

const SelectWrapper = styled(Wrapper)`
  height: 48px;
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: calc(100% + 16px);

  margin-top: -8px;

  background: #3f4247;
`;

const ChevronStack = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const NamesStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

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
`;

const ChainName = styled.div`
  font-size: 12px;
  line-height: 12px;
  font-weight: 400;
  color: #e0f3ff;
`;

const TokenStack = styled.div`
  width: 32px;
  height: 48px;
  position: relative;

  flex-grow: 0;
`;

const TokenImg = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  z-index: 1;

  mask: url(${TokenMask}) no-repeat center center;
`;

const ChainImg = styled.img`
  position: absolute;
  bottom: 0;
  left: 4.5px;
  width: 24px;
  height: 24px;
  z-index: 2;
`;

const ChevronDown = styled(ChevronDownIcon)`
  height: 16px;
  width: 16px;
`;
