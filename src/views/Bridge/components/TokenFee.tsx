import styled from "@emotion/styled";
import { Text, TextColor } from "components/Text";
import { BigNumber } from "ethers";
import { formatUnitsWithMaxFractions, TokenInfo } from "utils";

type TokenFeeProps = {
  token: TokenInfo;
  amount: BigNumber;
  textColor?: TextColor;
};

const TokenFee = ({ token, amount, textColor = "grey-400" }: TokenFeeProps) => (
  <Wrapper>
    <NumericText size="md" color={textColor}>
      {formatUnitsWithMaxFractions(amount, token.decimals)}{" "}
      {token.displaySymbol || token.symbol.toUpperCase()}{" "}
    </NumericText>
    <TokenSymbol src={token.logoURI} />
  </Wrapper>
);

export default TokenFee;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

const TokenSymbol = styled.img`
  width: 16px;
  height: 16px;
`;

const NumericText = styled(Text)`
  font-variant-numeric: tabular-nums !important;
`;
