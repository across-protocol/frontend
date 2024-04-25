import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Text, TextColor } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";

import {
  capitalizeFirstLetter,
  COLORS,
  formatUnitsWithMaxFractions,
  formatUSD,
  formatWeiPct,
  getChainInfo,
  isDefined,
  QUERIESV2,
  TokenInfo,
} from "utils";

import TokenFee from "./TokenFee";
import { type Props as FeesCollapsibleProps } from "./FeesCollapsible";
import { type EstimatedRewards } from "../hooks/useEstimatedRewards";

export type EstimatedTableProps = EstimatedRewards &
  Omit<FeesCollapsibleProps, "isQuoteLoading">;

const PriceFee = ({
  tokenFee,
  baseCurrencyFee,
  token,
  highlightTokenFee = false,
  rewardPercentageOfFees,
  hideSymbolOnEmpty = true,
  tokenIconFirstOnMobile = false,
}: {
  tokenFee?: BigNumber;
  baseCurrencyFee?: BigNumber;
  token: TokenInfo;
  highlightTokenFee?: boolean;
  rewardPercentageOfFees?: BigNumber;
  hideSymbolOnEmpty?: boolean;
  tokenIconFirstOnMobile?: boolean;
}) => {
  const Token = (isDefined(tokenFee) || !hideSymbolOnEmpty) && (
    <TokenSymbol src={token.logoURI} />
  );

  return (
    <BaseCurrencyWrapper invertOnMobile={tokenIconFirstOnMobile}>
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
      {Token}
    </BaseCurrencyWrapper>
  );
};

const EstimatedTable = ({
  toChainId,
  estimatedTime,
  gasFee,
  bridgeFee,
  inputToken,
  totalReceived,
  outputToken,
  referralRewardAsBaseCurrency,
  gasFeeAsBaseCurrency,
  bridgeFeeAsBaseCurrency,
  netFeeAsBaseCurrency,
  reward,
  rewardPercentage,
  hasDepositReward,
  rewardToken,
  isRewardAcx,
}: EstimatedTableProps) => {
  const rewardDisplaySymbol =
    rewardToken.displaySymbol || rewardToken.symbol.toUpperCase();

  return (
    <Wrapper>
      <Row stackOnMobile>
        <Text size="md" color="grey-400">
          {isRewardAcx
            ? "Across Referral Rewards"
            : `${rewardDisplaySymbol} Rewards`}
        </Text>
        <ReferralRewardWrapper
          isACX={isRewardAcx}
          isTransparent={!hasDepositReward}
        >
          <PriceFee
            token={rewardToken}
            tokenFee={reward}
            baseCurrencyFee={referralRewardAsBaseCurrency}
            hideSymbolOnEmpty={false}
            tokenIconFirstOnMobile
          />
        </ReferralRewardWrapper>
      </Row>
      <Row>
        <Text size="md" color="grey-400">
          Time to{" "}
          <Text as="span" color="light-200">
            {capitalizeFirstLetter(getChainInfo(toChainId).name)}
          </Text>
        </Text>
        <Text size="md" color="grey-400">
          {estimatedTime ? estimatedTime : "-"}
        </Text>
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
        <Text size="md" color={netFeeAsBaseCurrency ? "light-200" : "grey-400"}>
          {netFeeAsBaseCurrency ? `$ ${formatUSD(netFeeAsBaseCurrency)}` : "-"}
        </Text>
      </Row>
      <Divider />
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
          token={inputToken}
          tokenFee={bridgeFee}
          baseCurrencyFee={bridgeFeeAsBaseCurrency}
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
          token={inputToken}
          tokenFee={gasFee}
          baseCurrencyFee={gasFeeAsBaseCurrency}
        />
      </Row>
      <Row>
        <ToolTipWrapper>
          <Text size="md" color="grey-400">
            {rewardDisplaySymbol} Rebate
          </Text>
          <Tooltip
            title={`${rewardDisplaySymbol} Referral Reward`}
            body={`Estimate of ${rewardDisplaySymbol} earned on this transfer from the ${rewardDisplaySymbol} rebate program.`}
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
            highlightTokenFee={isRewardAcx}
            hideSymbolOnEmpty={!isDefined(netFeeAsBaseCurrency)}
          />
        </TransparentWrapper>
      </Row>
      <Divider />
      <Row>
        <Text size="md" color="grey-400">
          You will receive
        </Text>
        <Text size="md" color="grey-400">
          {totalReceived ? (
            <TotalReceive
              totalReceived={totalReceived}
              inputToken={inputToken}
              outputToken={outputToken}
              textColor="light-200"
            />
          ) : (
            "-"
          )}
        </Text>
      </Row>
    </Wrapper>
  );
};

export function TotalReceive({
  totalReceived,
  inputToken,
  outputToken,
  textColor,
}: {
  totalReceived: BigNumber;
  outputToken: TokenInfo;
  inputToken: TokenInfo;
  textColor?: TextColor;
}) {
  if (
    inputToken.symbol === outputToken.symbol ||
    inputToken.symbol === "USDC"
  ) {
    return (
      <TokenFee
        amount={totalReceived}
        token={outputToken}
        textColor={textColor}
      />
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
  isACX: boolean;
  isTransparent?: boolean;
}>`
  //Layout
  display: flex;
  padding: 6px 12px;
  align-items: center;
  gap: 4px;

  // Style
  border-radius: 22px;
  border: 1px solid ${({ isACX }) => COLORS[isACX ? "aqua-15" : "op-red-15"]};
  background: ${({ isACX }) => COLORS[isACX ? "aqua-5" : "op-red-5"]};

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
