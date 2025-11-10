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
import {
  AmountInputError,
  calcFeesForEstimatedTable,
  getTokensForFeesCalc,
} from "../utils";
import { BridgeLimitInterface } from "utils/serverless-api/types";
import { useTokenConversion } from "hooks/useTokenConversion";
import { UniversalSwapQuote } from "hooks/useUniversalSwapQuote";

export type Props = {
  isQuoteLoading: boolean;
  fromChainId: number;
  toChainId: number;
  isSwap: boolean;
  isUniversalSwap: boolean;
  gasFee?: BigNumber;
  capitalFee?: BigNumber;
  lpFee?: BigNumber;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  swapToken?: TokenInfo;
  swapQuote?: SwapQuoteApiResponse;
  universalSwapQuote?: UniversalSwapQuote;
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

  const { inputToken, bridgeTokenIn, bridgeTokenOut, outputToken } =
    getTokensForFeesCalc(props);

  const { convertTokenToBaseCurrency: convertInputTokenToUsd } =
    useTokenConversion(inputToken.symbol, "usd");
  const {
    convertTokenToBaseCurrency: convertBridgeTokenInToUsd,
    convertBaseCurrencyToToken: convertUsdToBridgeTokenIn,
  } = useTokenConversion(bridgeTokenIn.symbol, "usd");
  const { convertTokenToBaseCurrency: convertBridgeTokenOutToUsd } =
    useTokenConversion(bridgeTokenOut.symbol, "usd");
  const {
    convertTokenToBaseCurrency: convertOutputTokenToUsd,
    convertBaseCurrencyToToken: convertUsdToOutputToken,
  } = useTokenConversion(outputToken.symbol, "usd");

  const {
    bridgeFeeUsd,
    gasFeeUsd,
    outputAmountUsd,
    swapFeeUsd,
    parsedAmountUsd,
  } =
    calcFeesForEstimatedTable({
      ...props,
      convertInputTokenToUsd,
      convertBridgeTokenInToUsd,
      convertBridgeTokenOutToUsd,
      convertOutputTokenToUsd,
    }) || {};
  const outputAmount = convertUsdToOutputToken(outputAmountUsd);

  const isSwap =
    props.isSwap ||
    (props.isUniversalSwap &&
      Boolean(
        props.universalSwapQuote?.steps.originSwap ||
          props.universalSwapQuote?.steps.destinationSwap
      ));

  const estimatedRewards = useEstimatedRewards(
    bridgeTokenIn,
    props.toChainId,
    isSwap,
    convertUsdToBridgeTokenIn(parsedAmountUsd),
    convertUsdToBridgeTokenIn(gasFeeUsd),
    convertUsdToBridgeTokenIn(bridgeFeeUsd),
    convertUsdToBridgeTokenIn(swapFeeUsd)
  );

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
                    {outputAmountUsd && (
                      <HiddenMobileText size="md" color="grey-400">
                        (${formatUSD(outputAmountUsd)})
                      </HiddenMobileText>
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
                    {estimatedTime && (
                      <>
                        <HiddenMobileText size="md" color="grey-400">
                          in
                        </HiddenMobileText>
                        <HiddenMobileText size="md" color="light-200">
                          {estimatedTime}
                        </HiddenMobileText>
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
            {isSwap ? <SwapIcon /> : null}
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
            {outputAmountUsd && (
              <HiddenMobileText size="md" color="grey-400">
                (${formatUSD(outputAmountUsd)})
              </HiddenMobileText>
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
            {estimatedTime && (
              <>
                <HiddenMobileText size="md" color="grey-400">
                  in
                </HiddenMobileText>
                <HiddenMobileText size="md" color="light-200">
                  {estimatedTime}
                </HiddenMobileText>
              </>
            )}
          </TokenFeeWrapper>
        ) : (
          <Text size="md" color="grey-400">
            Transaction breakdown
          </Text>
        )}
        <CollapsedIconsWrapper>
          {isSwap ? <SwapIcon /> : null}
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

const HiddenMobileText = styled(Text)`
  @media ${QUERIESV2.xs.andDown} {
    display: none;
  }
`;
