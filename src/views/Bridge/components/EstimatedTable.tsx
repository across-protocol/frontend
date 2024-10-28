import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useState } from "react";

import { Text, TextColor } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { ReactComponent as SwapIcon } from "assets/icons/swap.svg";
import { ReactComponent as SettingsIcon } from "assets/icons/settings.svg";

import {
  COLORS,
  formatUSD,
  formatWeiPct,
  isBridgedUsdc,
  QUERIESV2,
  TokenInfo,
} from "utils";

import TokenFee from "./TokenFee";
import { type Props as FeesCollapsibleProps } from "./FeesCollapsible";
import { type EstimatedRewards } from "../hooks/useEstimatedRewards";
import { AmountInputError, calcFeesForEstimatedTable } from "../utils";
import { SwapSlippageModal } from "./SwapSlippageModal";
import { LoadingSkeleton } from "components";

export type EstimatedTableProps = EstimatedRewards & FeesCollapsibleProps;

const EstimatedTable = ({
  toChainId,
  gasFee,
  capitalFee,
  lpFee,
  inputToken,
  referralRewardAsBaseCurrency,
  gasFeeAsBaseCurrency,
  bridgeFeeAsBaseCurrency,
  netFeeAsBaseCurrency,
  swapFeeAsBaseCurrency,
  reward,
  rewardPercentage,
  hasDepositReward,
  rewardToken,
  isSwap,
  parsedAmount,
  currentSwapSlippage,
  swapQuote,
  swapToken,
  onSetNewSlippage,
  isQuoteLoading,
  validationError,
}: EstimatedTableProps) => {
  const rewardDisplaySymbol =
    rewardToken?.displaySymbol || rewardToken?.symbol.toUpperCase();
  const doesAmountExceedMaxDeposit =
    validationError === AmountInputError.INSUFFICIENT_LIQUIDITY ||
    validationError === AmountInputError.PAUSED_DEPOSITS;

  const { swapFee } = doesAmountExceedMaxDeposit
    ? {
        swapFee: undefined,
      }
    : calcFeesForEstimatedTable({
        gasFee,
        capitalFee,
        lpFee,
        isSwap,
        parsedAmount,
        swapQuote,
      }) || {};

  const [isSlippageModalOpen, setSlippageModalOpen] = useState(false);

  const showLoadingSkeleton = isQuoteLoading && !doesAmountExceedMaxDeposit;

  const nestedFeesRowElements = [
    <>
      <ToolTipWrapper>
        <Text size="md" color="grey-400">
          Bridge fee
        </Text>
        <Tooltip
          title="Bridge fee"
          body="Fee paid to Across Liquidity Providers and Relayers."
          placement="bottom-start"
        >
          <InfoIconWrapper>
            <InfoIcon />
          </InfoIconWrapper>
        </Tooltip>
      </ToolTipWrapper>
      <Text color="grey-400" size="md">
        {bridgeFeeAsBaseCurrency
          ? `$${formatUSD(bridgeFeeAsBaseCurrency)}`
          : "-"}
      </Text>
    </>,
    <>
      <ToolTipWrapper>
        <Text size="md" color="grey-400">
          Destination gas fee
        </Text>
        <Tooltip
          title="Destination gas fee"
          body="Fee to cover gas for destination chain fill transaction."
          placement="bottom-start"
        >
          <InfoIconWrapper>
            <InfoIcon />
          </InfoIconWrapper>
        </Tooltip>
      </ToolTipWrapper>
      <Text color="grey-400" size="md">
        {gasFeeAsBaseCurrency ? `$${formatUSD(gasFeeAsBaseCurrency)}` : "-"}
      </Text>
    </>,
    isSwap &&
    swapQuote &&
    swapToken &&
    swapFee &&
    swapFeeAsBaseCurrency &&
    !doesAmountExceedMaxDeposit ? (
      <>
        <ToolTipWrapper>
          <SwapFeeRowLabelWrapper>
            <SwapIcon />
            <Text size="md" color="grey-400">
              Swap fee
            </Text>
          </SwapFeeRowLabelWrapper>
          <Tooltip
            tooltipId="swap-fee-info"
            title="Swap fee"
            maxWidth={420}
            body={
              <SwapFeeTooltipBody>
                <Text size="sm" color="grey-400">
                  This bridge transaction requires you to perform a token swap
                  on the origin chain which incurs a swap fee.
                </Text>
                <Text size="sm" color="grey-400">
                  You can change the swap slippage in the <SettingsIcon /> to
                  the right.
                </Text>
                <Divider />
                <SwapRouteWrapper>
                  <Text size="sm" color="grey-400">
                    Swapping
                  </Text>
                  <Text size="sm" color="white">
                    {swapToken.displaySymbol || swapToken.symbol}
                  </Text>
                  <TokenSymbol src={swapToken.logoURI} />
                  <Text size="sm" color="grey-400">
                    for
                  </Text>
                  <Text size="sm" color="white">
                    {inputToken.displaySymbol || inputToken.symbol}
                  </Text>
                  <TokenSymbol src={inputToken.logoURI} />
                  <Text size="sm" color="grey-400">
                    on
                  </Text>
                  <Text size="sm" color="white" casing="capitalize">
                    {swapQuote.dex}
                  </Text>
                </SwapRouteWrapper>
              </SwapFeeTooltipBody>
            }
            placement="bottom-start"
          >
            <InfoIconWrapper>
              <InfoIcon />
            </InfoIconWrapper>
          </Tooltip>
        </ToolTipWrapper>
        <SwapSlippageSettings
          onClick={() => {
            if (onSetNewSlippage && currentSwapSlippage) {
              setSlippageModalOpen(true);
            }
          }}
        >
          <Text size="md" color="grey-400">
            ${formatUSD(swapFeeAsBaseCurrency)}
          </Text>
          <SettingsIcon />
        </SwapSlippageSettings>
      </>
    ) : undefined,
    rewardDisplaySymbol && rewardToken && rewardPercentage ? (
      <>
        <ToolTipWrapper>
          <Text size="md" color="grey-400">
            {rewardDisplaySymbol} Rebate
          </Text>
          <Tooltip
            title={`${rewardDisplaySymbol} Rebate Reward`}
            body={
              <>
                Up to {formatWeiPct(rewardPercentage)}% of bridge fee earned in{" "}
                {rewardDisplaySymbol}. Rebate is capped to a bridge fee of 25
                bps (0.25%). Final reward is calculated based on prior day{" "}
                {rewardDisplaySymbol} price.
              </>
            }
            placement="bottom-start"
          >
            <InfoIconWrapper>
              <InfoIcon />
            </InfoIconWrapper>
          </Tooltip>
        </ToolTipWrapper>
        <TransparentWrapper isTransparent={!hasDepositReward}>
          <Text size="md" color="grey-400">
            {referralRewardAsBaseCurrency
              ? `-$${formatUSD(referralRewardAsBaseCurrency)}`
              : "-"}
          </Text>
        </TransparentWrapper>
      </>
    ) : undefined,
  ].filter((element) => element !== undefined);

  return (
    <Wrapper>
      <Divider />
      {rewardToken && reward && (
        <>
          <Row>
            <ToolTipWrapper>
              <Text size="md" color="grey-400">
                {rewardDisplaySymbol} Rewards
              </Text>
              <Tooltip
                body={`Rebate rewards earned from the ${rewardDisplaySymbol} rewards program.`}
                title={`${rewardDisplaySymbol} Rewards`}
                placement="bottom-start"
              >
                <InfoIconWrapper>
                  <InfoIcon />
                </InfoIconWrapper>
              </Tooltip>
            </ToolTipWrapper>
            {showLoadingSkeleton ? (
              <LoadingSkeleton height="20px" width="75px" />
            ) : (
              <RewardRebateWrapper>
                {referralRewardAsBaseCurrency && (
                  <Text size="md" color="grey-400">
                    ${formatUSD(referralRewardAsBaseCurrency)}
                  </Text>
                )}
                <TokenFee
                  token={rewardToken}
                  amount={reward}
                  tokenChainId={toChainId}
                  textColor="light-200"
                />
              </RewardRebateWrapper>
            )}
          </Row>
          <Divider />
        </>
      )}
      <Row>
        <ToolTipWrapper>
          <Text size="md" color="grey-400">
            Net fee
          </Text>
          <Tooltip
            body="Total fees less any rewards, in USD."
            title="Net fee"
            placement="bottom-start"
          >
            <InfoIconWrapper>
              <InfoIcon />
            </InfoIconWrapper>
          </Tooltip>
        </ToolTipWrapper>
        {showLoadingSkeleton ? (
          <LoadingSkeleton height="20px" width="75px" />
        ) : (
          <Text
            size="md"
            color={netFeeAsBaseCurrency ? "light-200" : "grey-400"}
          >
            {netFeeAsBaseCurrency && !doesAmountExceedMaxDeposit
              ? `$ ${formatUSD(netFeeAsBaseCurrency)}`
              : "-"}
          </Text>
        )}
      </Row>
      <Divider />
      <InnerWrapper>
        <VectorVertical />
        {nestedFeesRowElements.map((element, index) => (
          <InnerRow key={index}>
            {index < nestedFeesRowElements.length - 1 && <VectorHorizontal />}
            {element}
          </InnerRow>
        ))}
      </InnerWrapper>
      {onSetNewSlippage && currentSwapSlippage && (
        <SwapSlippageModal
          isOpen={isSlippageModalOpen}
          onClose={() => setSlippageModalOpen(false)}
          onConfirm={(validSlippage) => {
            onSetNewSlippage(validSlippage);
            setSlippageModalOpen(false);
          }}
          currentSlippage={currentSwapSlippage}
        />
      )}
    </Wrapper>
  );
};

export function TotalReceive({
  totalReceived,
  inputToken,
  outputToken,
  textColor,
  destinationChainId,
  showLoadingSkeleton,
  swapPriceImpact,
  showPriceImpactWarning,
}: {
  totalReceived: BigNumber;
  outputToken: TokenInfo;
  inputToken: TokenInfo;
  textColor?: TextColor;
  destinationChainId: number;
  showLoadingSkeleton?: boolean;
  swapPriceImpact?: BigNumber;
  showPriceImpactWarning?: boolean;
}) {
  if (
    inputToken.symbol === outputToken.symbol ||
    inputToken.symbol === "USDC" ||
    isBridgedUsdc(inputToken.symbol) ||
    // Handle Blast USDB <-> DAI equivalency
    inputToken.symbol === "DAI" ||
    inputToken.symbol === "USDB"
  ) {
    return (
      <>
        <TokenFee
          amount={totalReceived}
          token={outputToken}
          textColor={textColor}
          showTokenLinkOnHover
          tokenChainId={destinationChainId}
          showLoadingSkeleton={showLoadingSkeleton}
          tokenFirst
        />
        {showPriceImpactWarning && swapPriceImpact && (
          <Text color="red">({formatWeiPct(swapPriceImpact, 5)}%)</Text>
        )}
      </>
    );
  }
  const tooltipText =
    inputToken.symbol === "ETH"
      ? "When bridging ETH and recipient address is a smart contract, or destination is Polygon, you will receive WETH."
      : "When bridging WETH and recipient address is an EOA, you will receive ETH.";

  return (
    <TotalReceiveRow>
      <Tooltip
        tooltipId="eth-weth-info"
        body={tooltipText}
        placement="bottom-start"
      >
        <WarningInfoIcon />
      </Tooltip>
      <TokenFee
        amount={totalReceived}
        token={outputToken}
        textColor="warning"
        showTokenLinkOnHover
        tokenChainId={destinationChainId}
        showLoadingSkeleton={showLoadingSkeleton}
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

const InnerWrapper = styled(Wrapper)`
  padding-left: 32px;
  padding-top: 8px;
  position: relative;
`;

const VectorVertical = styled.div`
  width: 14px;
  border-left: 2px ${COLORS["grey-500"]} solid;
  border-bottom: 2px ${COLORS["grey-500"]} solid;
  border-bottom-left-radius: 10px;

  position: absolute;
  top: 0;
  height: calc(100% - 8px);
  left: 8px;
`;

const VectorHorizontal = styled.div`
  position: absolute;
  top: 50%;
  left: -24px;

  width: 16px;
  height: 2px;

  background-color: ${COLORS["grey-500"]};
`;

const Row = styled.div<{ stackOnMobile?: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;

  width: 100%;

  @media ${QUERIESV2.xs.andDown} {
    flex-direction: ${({ stackOnMobile = false }) =>
      stackOnMobile ? "column" : "row"};
    align-items: flex-start;
    gap: 8px;
  }
`;

const InnerRow = styled(Row)`
  position: relative;
`;

const TotalReceiveRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const WarningInfoIcon = styled(InfoIcon)`
  path {
    stroke: ${COLORS.warning};
  }
`;

const ToolTipWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
`;

const InfoIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 16px;
  width: 16px;
`;

const Divider = styled.div`
  height: 1px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  background: ${COLORS["grey-600"]};
  width: 100%;
`;

const TokenSymbol = styled.img`
  width: 16px;
  height: 16px;
`;

const TransparentWrapper = styled.div<{ isTransparent: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;

  height: fit-content;
  width: fit-content;

  padding: 0;
  margin: 0;

  opacity: ${({ isTransparent }) => (isTransparent ? 0.5 : 1)};
`;

const SwapSlippageSettings = styled.div`
  display: flex;
  padding: 6px 12px;
  align-items: center;
  gap: 4px;

  border-radius: 22px;
  border: 1px solid var(--Color-Neutrals-grey-500, #4c4e57);

  cursor: pointer;
`;

const SwapFeeRowLabelWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const SwapFeeTooltipBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SwapRouteWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const RewardRebateWrapper = styled.div`
  display: flex;
  padding: 0 12px;
  align-items: center;
  gap: 4px;

  height: 32px;

  border-radius: 22px;
  border: 1px solid ${() => COLORS["grey-500"]};
  background: ${() => COLORS["grey-600"]};
`;
