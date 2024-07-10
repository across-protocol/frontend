import styled from "@emotion/styled";
import { BigNumber } from "ethers";
import { useState } from "react";

import { Text, TextColor } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info.svg";
import { ReactComponent as SwapIcon } from "assets/icons/swap.svg";
import { ReactComponent as SettingsIcon } from "assets/icons/settings.svg";

import {
  capitalizeFirstLetter,
  COLORS,
  formatUnitsWithMaxFractions,
  formatUSD,
  formatWeiPct,
  getChainInfo,
  isBridgedUsdc,
  isDefined,
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

const PriceFee = ({
  tokenFee,
  baseCurrencyFee,
  token,
  highlightTokenFee = false,
  rewardPercentageOfFees,
  hideSymbolOnEmpty = true,
  tokenIconFirstOnMobile = false,
  hideTokenIcon,
  showLoadingSkeleton,
}: {
  tokenFee?: BigNumber;
  baseCurrencyFee?: BigNumber;
  token: TokenInfo;
  highlightTokenFee?: boolean;
  rewardPercentageOfFees?: BigNumber;
  hideSymbolOnEmpty?: boolean;
  tokenIconFirstOnMobile?: boolean;
  hideTokenIcon?: boolean;
  showLoadingSkeleton?: boolean;
}) => {
  const Token = (isDefined(tokenFee) || !hideSymbolOnEmpty) &&
    !hideTokenIcon && <TokenSymbol src={token.logoURI} />;

  return (
    <BaseCurrencyWrapper invertOnMobile={tokenIconFirstOnMobile}>
      {showLoadingSkeleton ? (
        <LoadingSkeleton height="20px" width="70px" />
      ) : (
        <>
          {baseCurrencyFee && tokenFee && (
            <>
              {rewardPercentageOfFees && (
                <PercentageText size="md" color="grey-400">
                  ({formatWeiPct(rewardPercentageOfFees)}% of fees)
                </PercentageText>
              )}
              <Text size="md" color="grey-400">
                {`$${formatUSD(baseCurrencyFee)}`}
              </Text>
            </>
          )}
          {tokenFee ? (
            <Text size="md" color={highlightTokenFee ? "primary" : "light-200"}>
              {`${formatUnitsWithMaxFractions(tokenFee, token.decimals)} ${
                token.symbol
              }`}
            </Text>
          ) : (
            <Text size="md" color="grey-400">
              -
            </Text>
          )}
        </>
      )}
      {Token}
    </BaseCurrencyWrapper>
  );
};

const EstimatedTable = ({
  toChainId,
  estimatedTime,
  gasFee,
  capitalFee,
  lpFee,
  inputToken,
  outputToken,
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
  rewardProgram,
  showPriceImpactWarning,
  swapPriceImpact,
}: EstimatedTableProps) => {
  const rewardDisplaySymbol =
    rewardToken?.displaySymbol || rewardToken?.symbol.toUpperCase();
  const baseToken = swapToken || inputToken;
  const doesAmountExceedMaxDeposit =
    validationError === AmountInputError.INSUFFICIENT_LIQUIDITY;

  const { bridgeFee, outputAmount, swapFee } = doesAmountExceedMaxDeposit
    ? {
        bridgeFee: undefined,
        outputAmount: undefined,
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

  return (
    <Wrapper>
      {rewardToken && (
        <Row stackOnMobile>
          <Text size="md" color="grey-400">
            {`${rewardDisplaySymbol} Rewards`}
          </Text>
          <ReferralRewardWrapper
            rewardTokenPrimaryColor={rewardProgram?.primaryColor ?? "aqua"}
            isTransparent={!hasDepositReward}
          >
            <PriceFee
              token={rewardToken}
              tokenFee={reward}
              baseCurrencyFee={referralRewardAsBaseCurrency}
              hideSymbolOnEmpty={false}
              showLoadingSkeleton={showLoadingSkeleton}
            />
          </ReferralRewardWrapper>
        </Row>
      )}

      <Row>
        <Text size="md" color="grey-400">
          Time to{" "}
          <Text as="span" color="light-200">
            {capitalizeFirstLetter(getChainInfo(toChainId).name)}
          </Text>
        </Text>
        {showLoadingSkeleton ? (
          <LoadingSkeleton height="20px" width="75px" />
        ) : (
          <Text size="md" color="grey-400">
            {estimatedTime && !doesAmountExceedMaxDeposit ? estimatedTime : "-"}
          </Text>
        )}
      </Row>
      <Divider />
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
      {isSwap &&
        swapQuote &&
        swapToken &&
        swapFee &&
        !doesAmountExceedMaxDeposit && (
          <Row>
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
                      This bridge transaction requires you to perform a token
                      swap on the origin chain which incurs a swap fee.
                    </Text>
                    <Text size="sm" color="grey-400">
                      You can change the swap slippage in the <SettingsIcon />{" "}
                      to the right.
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
              <PriceFee
                token={baseToken}
                tokenFee={swapFee}
                baseCurrencyFee={swapFeeAsBaseCurrency}
                hideTokenIcon
                showLoadingSkeleton={showLoadingSkeleton}
              />
              <SettingsIcon />
            </SwapSlippageSettings>
          </Row>
        )}
      <Row>
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
        <PriceFee
          token={baseToken}
          tokenFee={bridgeFee}
          baseCurrencyFee={bridgeFeeAsBaseCurrency}
          showLoadingSkeleton={showLoadingSkeleton}
        />
      </Row>
      <Row>
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
        <PriceFee
          token={baseToken}
          tokenFee={doesAmountExceedMaxDeposit ? undefined : gasFee}
          baseCurrencyFee={gasFeeAsBaseCurrency}
          showLoadingSkeleton={showLoadingSkeleton}
        />
      </Row>
      {rewardDisplaySymbol && rewardToken && (
        <Row>
          <ToolTipWrapper>
            <Text size="md" color="grey-400">
              {rewardDisplaySymbol} Rebate
            </Text>
            <Tooltip
              title={`${rewardDisplaySymbol} Referral Reward`}
              body={`Estimate of ${rewardDisplaySymbol} earned from this transfer. Final reward is calculated based on prior day ${rewardDisplaySymbol} price.`}
              placement="bottom-start"
            >
              <InfoIconWrapper>
                <InfoIcon />
              </InfoIconWrapper>
            </Tooltip>
          </ToolTipWrapper>
          <TransparentWrapper isTransparent={!hasDepositReward}>
            <PriceFee
              token={rewardToken}
              tokenFee={reward}
              baseCurrencyFee={referralRewardAsBaseCurrency}
              rewardPercentageOfFees={rewardPercentage}
              hideSymbolOnEmpty={!isDefined(netFeeAsBaseCurrency)}
              showLoadingSkeleton={isQuoteLoading}
            />
          </TransparentWrapper>
        </Row>
      )}
      <Divider />
      <Row>
        <Text size="md" color="grey-400">
          You will receive
        </Text>
        <Text size="md" color="grey-400">
          {outputAmount ? (
            <TotalReceive
              totalReceived={outputAmount}
              inputToken={baseToken}
              outputToken={outputToken}
              textColor="light-200"
              destinationChainId={toChainId}
              showLoadingSkeleton={isQuoteLoading}
              showPriceImpactWarning={showPriceImpactWarning}
              swapPriceImpact={swapPriceImpact}
            />
          ) : (
            "-"
          )}
        </Text>
      </Row>
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
    isBridgedUsdc(inputToken.symbol)
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

const ReferralRewardWrapper = styled.div<{
  rewardTokenPrimaryColor: string;
  isTransparent?: boolean;
}>`
  //Layout
  display: flex;
  padding: 6px 12px;
  align-items: center;
  gap: 4px;

  // Style
  border-radius: 22px;
  border: 1px solid
    ${({ rewardTokenPrimaryColor }) => `${rewardTokenPrimaryColor}-15`};
  background: ${({ rewardTokenPrimaryColor }) =>
    `${rewardTokenPrimaryColor}-5`};

  // Opacity
  opacity: ${({ isTransparent = false }) => (isTransparent ? 0.5 : 1)};

  // Mobile
  @media ${QUERIESV2.xs.andDown} {
    width: 100%;
  }
`;

const BaseCurrencyWrapper = styled.div<{ invertOnMobile: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-direction: ${({ invertOnMobile }) =>
    invertOnMobile ? "row-reverse" : "row"};
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

const PercentageText = styled(Text)`
  @media ${QUERIESV2.xs.andDown} {
    display: none;
  }
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
