import styled from "@emotion/styled";
import { Text } from "components/Text";
import { BigNumber } from "ethers";
import { formatUnits, TokenInfo } from "utils";

type TokenFeeProps = {
  token: TokenInfo;
  amount: BigNumber;
};

const TokenFee = ({ token, amount }: TokenFeeProps) => (
  <Wrapper>
    <NumericText size="md" color="grey-400">
      {formatUnits(amount, token.decimals)} {token.symbol.toUpperCase()}{" "}
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
