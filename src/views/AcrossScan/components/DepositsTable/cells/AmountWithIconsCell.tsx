import styled from "@emotion/styled";

import { Text } from "components/Text";
import { TokenImage } from "components/TokenImage";
import { ChainInfo, COLORS, TokenInfo } from "utils/constants";
import { formatUnitsWithMaxFractions } from "utils/format";

import { BaseCell } from "./BaseCell";

type Props = {
  amount: string;
  token: TokenInfo;
  chain: ChainInfo;
  width: number;
};

export function AmountWithIconsCell({ amount, token, chain, width }: Props) {
  const tokenSymbol = token.displaySymbol || token.symbol;
  const formattedAmount = formatUnitsWithMaxFractions(amount, token.decimals);

  return (
    <StyledCell width={width}>
      <TokenStack>
        <TokenImg src={token.logoURI} alt={`${tokenSymbol} logo`} />
        <ChainImg src={chain.logoURI} alt={chain.name} />
      </TokenStack>
      <TextContainer>
        <Text color="light-200">{formattedAmount}</Text>
        <Text size="sm" color="grey-400">
          {tokenSymbol}
        </Text>
      </TextContainer>
    </StyledCell>
  );
}

const StyledCell = styled(BaseCell)`
  gap: 12px;
`;

const TokenStack = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
`;

const TokenImg = styled(TokenImage)`
  border-radius: 50%;
  width: 32px;
  height: 32px;
`;

const ChainImg = styled(TokenImage)`
  border-radius: 50%;
  border: 2px solid ${COLORS["black-800"]};
  background: ${COLORS["black-800"]};
  position: absolute;
  bottom: -2px;
  right: -4px;
  width: 16px;
  height: 16px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > div {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
`;
