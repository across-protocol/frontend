import styled from "@emotion/styled";

import { Text } from "components/Text";
import { IconPair } from "components/IconPair";
import { QUERIESV2, Token } from "utils";

import { BaseCell } from "./BaseCell";

type Props = {
  inputToken: Token;
  outputToken?: Token;
  swapToken?: Token;
  width: number;
};

export function AssetCell({
  inputToken,
  outputToken,
  swapToken,
  width,
}: Props) {
  const shouldDisplayIconPair =
    !!swapToken || (outputToken && inputToken.symbol !== outputToken.symbol);

  const Icon = shouldDisplayIconPair ? (
    <TokenPairContainer>
      <IconPair
        LeftIcon={
          <img src={inputToken.logoURI} alt={`${inputToken.symbol} logo`} />
        }
        RightIcon={
          <img
            src={swapToken?.logoURI || outputToken?.logoURI}
            alt={`${swapToken?.symbol || outputToken?.symbol} logo`}
          />
        }
        iconSize={24}
      />
    </TokenPairContainer>
  ) : (
    <TokenIconImg src={inputToken.logoURI} alt={`${inputToken.symbol} logo`} />
  );
  const AssetText = shouldDisplayIconPair ? (
    <div>
      <Text color="light-200">→{outputToken?.symbol || inputToken.symbol}</Text>
      <Text size="sm" color="grey-400">
        {swapToken?.symbol || inputToken.symbol}
      </Text>
    </div>
  ) : (
    <Text color="light-200">{inputToken.symbol}</Text>
  );
  return (
    <StyledAssetCell width={width}>
      {Icon}
      {AssetText}
    </StyledAssetCell>
  );
}

const StyledAssetCell = styled(BaseCell)`
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    gap: 16px;
  }
`;

const TokenIconImg = styled.img`
  width: 32px;
  height: 32px;

  @media ${QUERIESV2.sm.andDown} {
    width: 24px;
    height: 24px;
  }
`;

const TokenPairContainer = styled.div`
  margin-right: 2px;

  @media ${QUERIESV2.sm.andDown} {
    margin-right: 8px;
  }
`;
