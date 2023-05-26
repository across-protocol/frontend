import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { PopperTooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";

import {
  capitalizeFirstLetter,
  getChainInfo,
  TokenInfo,
  getToken,
} from "utils";

import TokenFee from "./TokenFee";

type EstimatedTableProps = {
  chainId: number;
  estimatedTime?: string;
  gasFee?: BigNumber;
  bridgeFee?: BigNumber;
  totalReceived?: BigNumber;
  token: TokenInfo;
  dataLoaded: boolean;
  willReceiveWETH?: boolean;
};

const EstimatedTable = ({
  chainId,
  estimatedTime,
  gasFee,
  bridgeFee,
  token,
  totalReceived,
  willReceiveWETH,
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
        {totalReceived ? (
          <TotalReceive
            totalReceived={totalReceived}
            token={token}
            willReceiveWETH={willReceiveWETH}
          />
        ) : (
          "-"
        )}
      </Text>
    </Row>
  </Wrapper>
);

function TotalReceive({
  totalReceived,
  token,
  willReceiveWETH,
}: {
  totalReceived: BigNumber;
  willReceiveWETH?: boolean;
  token: TokenInfo;
}) {
  if (!willReceiveWETH) {
    return <TokenFee amount={totalReceived} token={token} />;
  }
  return (
    <TotalReceiveRow>
      <PopperTooltip
        body="When bridging ETH and recipient address is a smart contract, or destination is Polygon, you will receive WETH."
        placement="bottom-start"
      >
        <WarningInfoIcon />
      </PopperTooltip>
      <TokenFee
        amount={totalReceived}
        token={getToken("WETH")}
        textColor="warning"
      />
    </TotalReceiveRow>
  );
}

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

const TotalReceiveRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const WarningInfoIcon = styled(InfoIcon)`
  path {
    stroke: #f9d26c;
  }
`;
