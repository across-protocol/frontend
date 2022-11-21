import styled from "@emotion/styled";
import CopyReferralLink from "components/CopyReferralLink";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-24.svg";
import { ReactComponent as TransferIcon } from "assets/icons/transfer-24.svg";
import { ReactComponent as GraphIcon } from "assets/icons/graph-24.svg";
import { ReactComponent as IncreaseIcon } from "assets/icons/increase-24.svg";
import { ReactComponent as TrophyIcon } from "assets/icons/trophy-24.svg";
import React from "react";
import { formatNumberMaxFracDigits, QUERIESV2 } from "utils";
import { BigNumberish } from "ethers";

type ConnectedReferralBoxType = {
  walletCount?: number;
  transferCount?: number;
  volume?: number;
  referralRate?: number;
  rewards?: string;
  formatter: (wei: BigNumberish) => string;
};

const ConnectedReferralBox = ({
  walletCount,
  transferCount,
  volume,
  referralRate,
  rewards,
  formatter,
}: ConnectedReferralBoxType) => {
  const referralElements = [
    {
      Icon: WalletIcon,
      title: "Wallets",
      value: walletCount,
    },
    {
      Icon: TransferIcon,
      title: "Transfers",
      value: transferCount,
    },
    {
      Icon: GraphIcon,
      title: "Volume",
      value: volume ? `$${formatNumberMaxFracDigits(volume)}` : undefined,
    },
    {
      Icon: IncreaseIcon,
      title: "Rate",
      value: referralRate ? (
        <>
          {referralRate * 100 * 0.75}%{" "}
          <ReferreeText>{referralRate * 100 * 0.25}% for referee</ReferreeText>
        </>
      ) : undefined,
    },
    {
      Icon: TrophyIcon,
      title: "Rewards",
      value: rewards ? `${formatter(rewards)} ACX` : undefined,
    },
  ];

  return (
    <Wrapper>
      <CardWrapper>
        {referralElements.map((val, ind, arr) => (
          <React.Fragment key={val.title}>
            <ReferralInfoCard>
              <ReferralInfoCardInnerWrapper>
                <ReferralInfoCardTitleWrapper>
                  <val.Icon />
                  {val.title}
                </ReferralInfoCardTitleWrapper>
                <ReferralInfoCardDataWrapper>
                  {val.value ?? "-"}
                </ReferralInfoCardDataWrapper>
              </ReferralInfoCardInnerWrapper>
            </ReferralInfoCard>
            {ind !== arr.length - 1 && (
              <DividerWrapper>
                <Divider />
              </DividerWrapper>
            )}
          </React.Fragment>
        ))}
      </CardWrapper>
      <CopyReferralLink />
    </Wrapper>
  );
};

export default ConnectedReferralBox;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;

  width: 100%;

  border: 1px solid #3e4047;
  border-radius: 10px;

  overflow: clip;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  width: 100%;
  gap: 0;

  background: #34353b;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
  }
`;

const ReferralInfoCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 24px;
  gap: 12px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px;
  }
`;

const ReferralInfoCardInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
`;

const ReferralInfoCardTitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 12px;

  font-size: 16px;
  line-height: 20px;
  color: #9daab2;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
    & svg {
      height: 16px;
      width: 16px;
    }
  }
`;

const ReferralInfoCardDataWrapper = styled.div`
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;

  @media ${QUERIESV2.tb.andDown} {
    font-size: 16px;
  }

  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 56px;
  background: #3e4047;

  @media ${QUERIESV2.tb.andDown} {
    width: 100%;
    height: 1px;
  }
`;

const DividerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background: #34353b;

  padding: 24px 0;

  @media ${QUERIESV2.tb.andDown} {
    padding: 0 24px;
    width: 100%;
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: 0 16px;
  }
`;

const ReferreeText = styled.span`
  color: #9daab2;
`;
