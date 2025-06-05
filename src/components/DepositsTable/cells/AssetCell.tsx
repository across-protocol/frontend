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
  const leftToken = swapToken || inputToken;
  const rightToken = outputToken || inputToken;
  const leftTokenSymbol = leftToken.displaySymbol || leftToken.symbol;
  const rightTokenSymbol = rightToken.displaySymbol || rightToken.symbol;
  const shouldDisplayIconPair = leftTokenSymbol !== rightTokenSymbol;

  const Icon = shouldDisplayIconPair ? (
    <TokenPairContainer>
      <IconPair
        LeftIcon={
          <img src={leftToken.logoURI} alt={`${leftTokenSymbol} logo`} />
        }
        RightIcon={
          <img src={rightToken.logoURI} alt={`${rightTokenSymbol} logo`} />
        }
        iconSize={24}
      />
    </TokenPairContainer>
  ) : (
    <TokenIconImg src={leftToken.logoURI} alt={`${leftTokenSymbol} logo`} />
  );
  const AssetText = shouldDisplayIconPair ? (
    <div>
      <Text color="light-200">→{rightTokenSymbol}</Text>
      <Text size="sm" color="grey-400">
        {leftTokenSymbol}
      </Text>
    </div>
  ) : (
    <Text color="light-200">{leftTokenSymbol}</Text>
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
