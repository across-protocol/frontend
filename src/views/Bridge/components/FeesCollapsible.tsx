import { useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { BigNumber } from "ethers";

import { Text } from "components";
import { ReactComponent as ChevronDown } from "assets/icons/arrow-16.svg";
import { TokenInfo } from "utils";

import EstimatedTable, { TotalReceive } from "./EstimatedTable";
import { useEstimatedRewards } from "../hooks/useEstimatedRewards";
import TokenFee from "./TokenFee";

export type Props = {
  isQuoteLoading: boolean;
  fromChainId: number;
  toChainId: number;
  estimatedTime?: string;
  gasFee?: BigNumber;
  bridgeFee?: BigNumber;
  totalReceived?: BigNumber;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
};

export function FeesCollapsible(props: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const estimatedRewards = useEstimatedRewards(
    props.inputToken,
    props.toChainId,
    props.gasFee,
    props.bridgeFee
  );

  if (!isExpanded) {
    return (
      <CollapsedFeesWrapper>
        <CollapsedFeesLabel>
          <Text color="grey-400">Receive</Text>
        </CollapsedFeesLabel>
        <CollapsedFeesReceiveWrapper onClick={() => setIsExpanded(true)}>
          {props.isQuoteLoading ? (
            <CollapsedLoadingSkeleton />
          ) : (
            <CollapsedFeesAmountsWrapper>
              {props.totalReceived ? (
                <>
                  <TotalReceive
                    totalReceived={props.totalReceived}
                    inputToken={props.inputToken}
                    outputToken={props.outputToken}
                    textColor="light-200"
                  />
                  {estimatedRewards.reward && (
                    <>
                      <Text color="grey-400"> and </Text>
                      <TokenFee
                        token={estimatedRewards.rewardToken}
                        amount={estimatedRewards.reward}
                        textColor="light-200"
                      />
                    </>
                  )}
                  {props.estimatedTime && (
                    <>
                      <Text color="grey-400"> in </Text>
                      <Text color="light-200">{props.estimatedTime}</Text>
                    </>
                  )}
                </>
              ) : (
                "-"
              )}
            </CollapsedFeesAmountsWrapper>
          )}

          <ChevronDown />
        </CollapsedFeesReceiveWrapper>
      </CollapsedFeesWrapper>
    );
  }

  return (
    <ExpandedFeesWrapper>
      <ExpandedFeesTopRow onClick={() => setIsExpanded(false)}>
        <Text size="md" color="grey-400">
          Transaction breakdown
        </Text>
        <ChevronUp />
      </ExpandedFeesTopRow>
      <ExpandedFeesTableWrapper>
        <EstimatedTable {...props} {...estimatedRewards} />
      </ExpandedFeesTableWrapper>
    </ExpandedFeesWrapper>
  );
}

const shimmer = keyframes`
  to {
    background-position-x: 0%
  }
`;

const CollapsedLoadingSkeleton = styled.div`
  display: flex;
  height: 20px;
  width: 100%;
  border-radius: 24px;
  margin-right: 12px;
  background: linear-gradient(
    90deg,
    rgba(76, 78, 87, 0) 40%,
    #4c4e57 50%,
    rgba(76, 78, 87, 0) 60%
  );
  background-size: 300%;
  background-position-x: 100%;
  animation: ${shimmer} 1s infinite linear;
`;

const CollapsedFeesWrapper = styled.div`
  display: flex;
  height: 48px;
  gap: 12px;
  width: 100%;
`;

const CollapsedFeesLabel = styled.div`
  width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CollapsedFeesReceiveWrapper = styled.div`
  display: flex;
  height: 48px;
  padding-left: 16px;
  padding-right: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  border-radius: 12px;
  border: 1px solid #3e4047;
  background: #393a40;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);

  cursor: pointer;
`;

const CollapsedFeesAmountsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const ExpandedFeesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  border-radius: 12px;
  border: 1px solid #3e4047;
  background: #393a40;
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
`;

const ExpandedFeesTopRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  padding-right: 12px;

  cursor: pointer;
`;

const ExpandedFeesTableWrapper = styled.div`
  padding: 16px;
`;

const ChevronUp = styled(ChevronDown)`
  rotate: 180deg;
`;
