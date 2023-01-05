import styled from "@emotion/styled";
import { Text } from "components/Text";
import { BigNumber } from "ethers";
import { TokenInfo } from "utils";
import { utils } from "ethers";

type TokenFeeProps = {
  token: TokenInfo;
  amount: BigNumber;
};

const TokenFee = ({ token, amount }: TokenFeeProps) => (
  <Wrapper>
    <Text size="md" color="grey-400">
      {utils.formatUnits(amount, token.decimals)} {token.symbol.toUpperCase()}{" "}
    </Text>
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
