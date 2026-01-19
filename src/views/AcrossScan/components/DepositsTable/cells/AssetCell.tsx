import styled from "@emotion/styled";

import { Text } from "components/Text";
import { IconPair } from "components/IconPair";
import { TokenImage } from "components/TokenImage";
import { QUERIESV2, TokenInfo } from "utils";

import { BaseCell } from "./BaseCell";

type Props = {
  inputToken: TokenInfo;
  outputToken?: TokenInfo;
  swapToken?: TokenInfo;
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
          <TokenImage src={leftToken.logoURI} alt={`${leftTokenSymbol} logo`} />
        }
        RightIcon={
          <TokenImage
            src={rightToken.logoURI}
            alt={`${rightTokenSymbol} logo`}
          />
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

const TokenIconImg = styled(TokenImage)`
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
