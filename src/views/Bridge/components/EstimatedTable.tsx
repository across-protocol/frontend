import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { ReactComponent as UnstyledArrowIcon } from "assets/icons/arrow-16.svg";

import {
  isBridgedUsdc,
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
import { useEstimatedTable } from "../hooks/useEstimatedTable";

type EstimatedTableProps = {
  fromChainId: number;
  toChainId: number;
  estimatedTime?: string;
  gasFee?: BigNumber;
  bridgeFee?: BigNumber;
  totalReceived?: BigNumber;
  token: TokenInfo;
  receiveToken: TokenInfo;
};

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
        <Text size="md" color={highlightTokenFee ? "primary" : "white"}>
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
  fromChainId,
  toChainId,
  estimatedTime,
  gasFee,
  bridgeFee,
  token,
  totalReceived,
  receiveToken,
}: EstimatedTableProps) => {
  const {
    isDetailedFeesAvailable,
    setIsDetailedFeesAvailable,
    referralRewardAsBaseCurrency,
    gasFeeAsBaseCurrency,
    bridgeFeeAsBaseCurrency,
    netFeeAsBaseCurrency,
    depositReferralReward,
    depositReferralPercentage,
    hasDepositReferralReward,
    rewardToken,
    isRewardAcx,
  } = useEstimatedTable(token, toChainId, gasFee, bridgeFee);

  const ArrowIcon = isDetailedFeesAvailable ? ArrowIconUp : ArrowIconDown;
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
          isTransparent={!hasDepositReferralReward}
        >
          <PriceFee
            token={rewardToken}
            tokenFee={depositReferralReward}
            baseCurrencyFee={referralRewardAsBaseCurrency}
            hideSymbolOnEmpty={false}
            tokenIconFirstOnMobile
          />
        </ReferralRewardWrapper>
      </Row>
      <Row>
        <Text size="md" color="grey-400">
          Time to{" "}
          <WhiteText>
            {capitalizeFirstLetter(getChainInfo(toChainId).name)}
          </WhiteText>
        </Text>
        <Text size="md" color="grey-400">
          {estimatedTime ? estimatedTime : "-"}
        </Text>
      </Row>
      <Divider />
      <ClickableRow onClick={() => setIsDetailedFeesAvailable((v) => !v)}>
        <ToolTipWrapper>
          <ArrowIcon />
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
        <Text size="md" color={netFeeAsBaseCurrency ? "white" : "grey-400"}>
          {netFeeAsBaseCurrency ? `$ ${formatUSD(netFeeAsBaseCurrency)}` : "-"}
        </Text>
      </ClickableRow>
      {isDetailedFeesAvailable && (
        <>
          <ShiftedRow>
            <Divider />
          </ShiftedRow>
          <ShiftedRow>
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
              token={token}
              tokenFee={bridgeFee}
              baseCurrencyFee={bridgeFeeAsBaseCurrency}
            />
          </ShiftedRow>
          <ShiftedRow>
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
              token={token}
              tokenFee={gasFee}
              baseCurrencyFee={gasFeeAsBaseCurrency}
            />
          </ShiftedRow>
          <ShiftedRow>
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
            <TransparentWrapper isTransparent={!hasDepositReferralReward}>
              <PriceFee
                token={rewardToken}
                tokenFee={depositReferralReward}
                baseCurrencyFee={referralRewardAsBaseCurrency}
                rewardPercentageOfFees={depositReferralPercentage}
                highlightTokenFee={isRewardAcx}
                hideSymbolOnEmpty={!isDefined(netFeeAsBaseCurrency)}
              />
            </TransparentWrapper>
          </ShiftedRow>
        </>
      )}
      <Divider />
      <Row>
        <Text size="md" color="grey-400">
          You will receive
        </Text>
        <Text size="md" color="grey-400">
          {totalReceived ? (
            <TotalReceive
              totalReceived={totalReceived}
              token={token}
              receiveToken={receiveToken}
              srcChainId={fromChainId}
              destinationChainId={toChainId}
            />
          ) : (
            "-"
          )}
        </Text>
      </Row>
    </Wrapper>
  );
};

function TotalReceive({
  totalReceived,
  token,
  receiveToken,
  srcChainId,
  destinationChainId,
}: {
  totalReceived: BigNumber;
  receiveToken: TokenInfo;
  token: TokenInfo;
  srcChainId: number;
  destinationChainId: number;
}) {
  const areTokensSame = token.symbol === receiveToken.symbol;

  if (areTokensSame) {
    return <TokenFee amount={totalReceived} token={token} />;
  }
  const sourceChainName = capitalizeFirstLetter(getChainInfo(srcChainId).name);
  const destinationChainName = capitalizeFirstLetter(
    getChainInfo(destinationChainId).name
  );
  const tooltipText =
    token.symbol === "ETH"
      ? "When bridging ETH and recipient address is a smart contract, or destination is Polygon, you will receive WETH."
      : token.symbol === "WETH"
      ? "When bridging WETH and recipient address is an EOA, you will receive ETH."
      : `When bridging ${
          token.symbol
        } from ${sourceChainName} to ${destinationChainName}, you will receive ${
          receiveToken.symbol
        }${isBridgedUsdc(receiveToken.symbol) ? " (bridged USDC)" : ""}.`;

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
        token={receiveToken}
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

const ClickableRow = styled(Row)`
  cursor: pointer;
`;

const ShiftedRow = styled(Row)`
  padding-left: 24px;
`;

const WhiteText = styled.span`
  color: ${COLORS.white};
`;

const TotalReceiveRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const WarningInfoIcon = styled(InfoIcon)`
  margin-top: 8px;
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

const ArrowIconDown = styled(UnstyledArrowIcon)`
  path {
    stroke: ${COLORS["white-70"]};
  }
`;

const ArrowIconUp = styled(ArrowIconDown)`
  rotate: 180deg;
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
