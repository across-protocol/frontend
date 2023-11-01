import styled from "@emotion/styled";
import { BigNumber } from "ethers";

import { Text } from "components/Text";
import { Tooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { ReactComponent as UnstyledArrowIcon } from "assets/icons/arrow-16.svg";

import {
  bridgedUSDCSymbolsMap,
  capitalizeFirstLetter,
  formatUnits,
  formatUnitsFnBuilder,
  getChainInfo,
  getToken,
  TokenInfo,
} from "utils";

import TokenFee from "./TokenFee";
import { useState } from "react";
import { ConvertTokensToBaseCurrencyType } from "../hooks/useBridge";

type EstimatedTableProps = {
  fromChainId: number;
  toChainId: number;
  estimatedTime?: string;
  gasFee?: BigNumber;
  bridgeFee?: BigNumber;
  totalReceived?: BigNumber;
  token: TokenInfo;
  dataLoaded: boolean;
  receiveToken: TokenInfo;
  convertTokensToBaseCurrency: ConvertTokensToBaseCurrencyType;
  depositReferralReward?: BigNumber;
};

const PriceFee = ({
  tokenFee,
  baseCurrencyFee,
  token,
  highlightTokenFee = false,
}: {
  tokenFee?: BigNumber;
  baseCurrencyFee?: BigNumber;
  token: TokenInfo;
  highlightTokenFee?: boolean;
}) => (
  <BaseCurrencyWrapper>
    {baseCurrencyFee && tokenFee && (
      <Text size="md" color="grey-400">
        {`$${formatUnits(baseCurrencyFee, 18)}`}
      </Text>
    )}
    {tokenFee ? (
      <Text size="md" color={highlightTokenFee ? "primary" : "white"}>
        {`${formatUnits(tokenFee, token.decimals)} ${token.symbol}`}
      </Text>
    ) : (
      <Text size="md" color="grey-400">
        -
      </Text>
    )}
    {tokenFee && <TokenSymbol src={token.logoURI} />}
  </BaseCurrencyWrapper>
);

const EstimatedTable = ({
  fromChainId,
  toChainId,
  estimatedTime,
  gasFee,
  bridgeFee,
  token,
  totalReceived,
  receiveToken,
  convertTokensToBaseCurrency: { l1: convertL1Token, acx: convertACXToken },
  depositReferralReward,
}: EstimatedTableProps) => {
  const [isDetailedFeesAvailable, setIsDetailedFeesAvailable] = useState(false);
  const ArrowIcon = isDetailedFeesAvailable ? ArrowIconUp : ArrowIconDown;
  const hasDepositReferralReward =
    depositReferralReward && depositReferralReward.gt(0);

  const referralRewardAsBaseCurrency = convertACXToken(depositReferralReward);
  const gasFeeAsBaseCurrency = convertL1Token(gasFee);
  const bridgeFeeAsBaseCurrency = convertL1Token(bridgeFee);
  const netFeeAsBaseCurrency =
    gasFeeAsBaseCurrency && bridgeFeeAsBaseCurrency
      ? gasFeeAsBaseCurrency.add(bridgeFeeAsBaseCurrency)
      : undefined;
  const formatUsd = formatUnitsFnBuilder(18);

  return (
    <Wrapper>
      {hasDepositReferralReward && (
        <Row>
          <Text size="md" color="grey-400">
            Across Referral Rewards
          </Text>
          <ReferralRewardWrapper>
            <PriceFee
              token={getToken("ACX")}
              tokenFee={depositReferralReward}
              baseCurrencyFee={referralRewardAsBaseCurrency}
            />
          </ReferralRewardWrapper>
        </Row>
      )}
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
            body="Total fees less any rewards, in USD"
            title="Net fee"
            placement="bottom-start"
          >
            <InfoIconWrapper>
              <InfoIcon />
            </InfoIconWrapper>
          </Tooltip>
        </ToolTipWrapper>
        <Text size="md" color={netFeeAsBaseCurrency ? "white" : "grey-400"}>
          {netFeeAsBaseCurrency ? `$ ${formatUsd(netFeeAsBaseCurrency)}` : "-"}
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
          {hasDepositReferralReward && (
            <ShiftedRow>
              <ToolTipWrapper>
                <Text size="md" color="grey-400">
                  ACX Referral Reward
                </Text>
                <Tooltip
                  title="ACX Referral Reward"
                  body="Estimate of ACX earned on this transfer from Referral Rewards program."
                  placement="bottom-start"
                >
                  <InfoIconWrapper>
                    <InfoIcon />
                  </InfoIconWrapper>
                </Tooltip>
              </ToolTipWrapper>
              <PriceFee
                token={getToken("ACX")}
                tokenFee={depositReferralReward}
                baseCurrencyFee={referralRewardAsBaseCurrency}
                highlightTokenFee
              />
            </ShiftedRow>
          )}
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
          bridgedUSDCSymbolsMap[destinationChainId] || "USDC"
        }${
          bridgedUSDCSymbolsMap[destinationChainId] ? " (bridged USDC)" : ""
        }.`;

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

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 6px;

  width: 100%;
`;

const ClickableRow = styled(Row)`
  cursor: pointer;
`;

const ShiftedRow = styled(Row)`
  padding-left: 24px;
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
  margin-top: 8px;
  path {
    stroke: #f9d26c;
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

const ReferralRewardWrapper = styled.div`
  //Layout
  display: flex;
  padding: 6px 12px;
  align-items: center;
  gap: 4px;

  // Style
  border-radius: 22px;
  border: 1px solid var(--color-interface-aqua-15, rgba(108, 249, 216, 0.15));
  background: var(--color-interface-aqua-5, rgba(108, 249, 216, 0.05));
`;

const BaseCurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Divider = styled.div`
  height: 1px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  background: var(--color-neutrals-grey-600, #3e4047);
  width: 100%;
`;

const ArrowIconDown = styled(UnstyledArrowIcon)`
  path {
    stroke: #9daab2;
  }
`;

const ArrowIconUp = styled(ArrowIconDown)`
  rotate: 180deg;
`;

const TokenSymbol = styled.img`
  width: 16px;
  height: 16px;
`;
