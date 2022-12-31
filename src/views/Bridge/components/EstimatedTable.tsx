import styled from "@emotion/styled";
import { Text } from "components/Text";
import { BigNumber } from "ethers";
import { capitalizeFirstLetter, getChainInfo, TokenInfo } from "utils";
import { repeatableTernaryBuilder } from "utils/ternary";
import TokenFee from "./TokenFee";

type EstimatedTableProps = {
  chainId: number;
  estimatedTime?: string;
  gasFee?: BigNumber;
  bridgeFee?: BigNumber;
  totalFee?: BigNumber;
  token: TokenInfo;
  dataLoaded: boolean;
};

const EstimatedTable = ({
  dataLoaded,
  chainId,
  estimatedTime,
  gasFee,
  bridgeFee,
  token,
  totalFee,
}: EstimatedTableProps) => (
  <Wrapper>
    <Row>
      <Text size="md" color="grey-400">
        Time to{" "}
        <WhiteText>
          {capitalizeFirstLetter(getChainInfo(chainId).name)}
        </WhiteText>
      </Text>
      <Text size="md" color="grey-400">
        {estimatedTime ? estimatedTime : "-"}
      </Text>
    </Row>
    <Row>
      <Text size="md" color="grey-400">
        Destination gas fee
      </Text>
      <Text size="md" color="grey-400">
        {gasFee ? <TokenFee amount={gasFee} token={token} /> : "-"}
      </Text>
    </Row>
    <Row>
      <Text size="md" color="grey-400">
        Bridge fee
      </Text>
      <Text size="md" color="grey-400">
        {bridgeFee ? <TokenFee amount={bridgeFee} token={token} /> : "-"}
      </Text>
    </Row>
    <Row>
      <Text size="md" color="grey-400">
        You will receive
      </Text>
      <Text size="md" color="grey-400">
        {totalFee ? <TokenFee amount={totalFee} token={token} /> : "-"}
      </Text>
    </Row>
  </Wrapper>
);

export default EstimatedTable;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;

  width: 100%;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;

  width: 100%;
`;

const WhiteText = styled.span`
  color: #e0f3ff;
`;
