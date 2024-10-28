import { useState } from "react";
import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Text, LoadingSkeleton } from "components";
import { ReactComponent as ChevronDown } from "assets/icons/chevron-down.svg";
import { ReactComponent as _SwapIcon } from "assets/icons/swap.svg";
import {
  QUERIESV2,
  TokenInfo,
  formatUSD,
  getConfirmationDepositTime,
} from "utils";

import EstimatedTable from "./EstimatedTable";
import { useEstimatedRewards } from "../hooks/useEstimatedRewards";
import TokenFee from "./TokenFee";
import { SwapQuoteApiResponse } from "utils/serverless-api/prod/swap-quote";
import { AmountInputError, calcFeesForEstimatedTable } from "../utils";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { useTokenConversion } from "hooks/useTokenConversion";

export type Props = {
  isQuoteLoading: boolean;
  fromChainId: number;
  toChainId: number;
  isSwap: boolean;
  gasFee?: BigNumber;
  capitalFee?: BigNumber;
  lpFee?: BigNumber;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  swapToken?: TokenInfo;
  swapQuote?: SwapQuoteApiResponse;
  parsedAmount?: BigNumber;
  currentSwapSlippage?: number;
  onSetNewSlippage?: (slippage: number) => void;
  validationError?: AmountInputError;
  quotedLimits?: BridgeLimitInterface;
  showPriceImpactWarning?: boolean;
  swapPriceImpact?: BigNumber;
  estimatedFillTimeSec?: number;
};

export function FeesCollapsible(props: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const baseToken = props.swapToken || props.inputToken;
  const { bridgeFee, outputAmount, swapFee } =
    calcFeesForEstimatedTable(props) || {};

  const estimatedRewards = useEstimatedRewards(
    baseToken,
    props.toChainId,
    props.isSwap,
    props.parsedAmount,
    props.gasFee,
    bridgeFee,
    swapFee
  );

  const { convertTokenToBaseCurrency } = useTokenConversion(
    props.outputToken.symbol,
    "usd"
  );
  const outputAmountInUSD = convertTokenToBaseCurrency(outputAmount);

  const doesAmountExceedMaxDeposit =
    props.validationError === AmountInputError.INSUFFICIENT_LIQUIDITY ||
    props.validationError === AmountInputError.PAUSED_DEPOSITS;

  const estimatedTime =
    props.quotedLimits && outputAmount && !doesAmountExceedMaxDeposit
      ? getConfirmationDepositTime(
          props.fromChainId,
          props.estimatedFillTimeSec
        ).formattedString
      : "-";

  if (!isExpanded) {
    return (
      <CollapsedFeesWrapper>
        <CollapsedFeesReceiveWrapper
          errorOutline={props.showPriceImpactWarning}
          onClick={() => setIsExpanded(true)}
        >
          {props.isQuoteLoading && !doesAmountExceedMaxDeposit ? (
            <CollapsedLoadingSkeleton width="100%" height="20px" />
          ) : (
            <CollapsedFeesAmountsWrapper>
              {outputAmount && !doesAmountExceedMaxDeposit ? (
                <>
                  <TokenFeeWrapper>
                    <TokenFee
                      token={props.outputToken}
                      amount={outputAmount}
                      tokenFirst
                      tokenChainId={props.toChainId}
                      textColor="light-200"
                      showTokenLinkOnHover
                    />
                    {outputAmountInUSD && (
                      <Text size="md" color="grey-400">
                        (${formatUSD(outputAmountInUSD)})
                      </Text>
                    )}
                    {estimatedRewards.rewardToken &&
                      estimatedRewards.reward && (
                        <>
                          <Text size="md" color="grey-400">
                            and
                          </Text>
                          <TokenFee
                            token={estimatedRewards.rewardToken}
                            amount={estimatedRewards.reward}
                            tokenFirst
                            tokenChainId={props.toChainId}
                            textColor="light-200"
                            showTokenLinkOnHover
                          />
                        </>
                      )}
                    {!props.isSwap && estimatedTime && (
                      <>
                        <Text size="md" color="grey-400">
                          in
                        </Text>
                        <Text size="md" color="light-200">
                          {estimatedTime}
                        </Text>
                      </>
                    )}
                  </TokenFeeWrapper>
                </>
              ) : (
                "-"
              )}
            </CollapsedFeesAmountsWrapper>
          )}
          <CollapsedIconsWrapper>
            {props.isSwap ? <SwapIcon /> : null}
            <ChevronDown />
          </CollapsedIconsWrapper>
        </CollapsedFeesReceiveWrapper>
      </CollapsedFeesWrapper>
    );
  }

  return (
    <ExpandedFeesWrapper errorOutline={props.showPriceImpactWarning}>
      <ExpandedFeesTopRow onClick={() => setIsExpanded(false)}>
        {outputAmount ? (
          <TokenFeeWrapper>
            <TokenFee
              token={props.outputToken}
              amount={outputAmount}
              tokenFirst
              tokenChainId={props.toChainId}
              textColor="light-200"
              showTokenLinkOnHover
            />
            {outputAmountInUSD && (
              <Text size="md" color="grey-400">
                (${formatUSD(outputAmountInUSD)})
              </Text>
            )}
            {estimatedRewards.rewardToken && estimatedRewards.reward && (
              <>
                <Text size="md" color="grey-400">
                  and
                </Text>
                <TokenFee
                  token={estimatedRewards.rewardToken}
                  amount={estimatedRewards.reward}
                  tokenFirst
                  tokenChainId={props.toChainId}
                  textColor="light-200"
                  showTokenLinkOnHover
                />
              </>
            )}
            {!props.isSwap && estimatedTime && (
              <>
                <Text size="md" color="grey-400">
                  in
                </Text>
                <Text size="md" color="light-200">
                  {estimatedTime}
                </Text>
              </>
            )}
          </TokenFeeWrapper>
        ) : (
          <Text size="md" color="grey-400">
            Transaction breakdown
          </Text>
        )}
        <CollapsedIconsWrapper>
          {props.isSwap ? <SwapIcon /> : null}
          <ChevronUp />
        </CollapsedIconsWrapper>
      </ExpandedFeesTopRow>
      <ExpandedFeesTableWrapper>
        <EstimatedTable {...props} {...estimatedRewards} />
      </ExpandedFeesTableWrapper>
    </ExpandedFeesWrapper>
  );
}

const CollapsedLoadingSkeleton = styled(LoadingSkeleton)`
  margin-right: 12px;
`;

const CollapsedFeesWrapper = styled.div`
  display: flex;
  height: 48px;
  gap: 12px;
  width: 100%;

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: column;
    height: auto;
  }
`;

const CollapsedFeesReceiveWrapper = styled.div<{ errorOutline?: boolean }>`
  display: flex;
  height: 48px;
  padding-left: 16px;
  padding-right: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  border-radius: 12px;
  border: 1px solid;
  border-color: ${({ errorOutline }) =>
    errorOutline ? "rgba(249, 108, 108, 0.1)" : "#3e4047"};
  background: ${({ errorOutline }) =>
    errorOutline ? "rgba(249, 108, 108, 0.05)" : "#393a40"};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.08);

  cursor: pointer;

  @media ${QUERIESV2.xs.andDown} {
    min-height: 50px;
    margin-bottom: 12px;
  }
`;

const CollapsedFeesAmountsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ExpandedFeesWrapper = styled.div<{ errorOutline?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;

  border-radius: 12px;
  border: 1px solid #3e4047;
  border-color: ${({ errorOutline }) =>
    errorOutline ? "rgba(249, 108, 108, 0.1)" : "#3e4047"};
  background: ${({ errorOutline }) =>
    errorOutline ? "rgba(249, 108, 108, 0.05)" : "#393a40"};
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
  padding-top: 0;
`;

const ChevronUp = styled(ChevronDown)`
  rotate: 180deg;
`;

const SwapIcon = styled(_SwapIcon)`
  align-self: flex-end;
`;

const CollapsedIconsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const TokenFeeWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;
