import styled from "@emotion/styled";
import CopyReferralLink from "components/CopyReferralLink";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-24.svg";
import { ReactComponent as TransferIcon } from "assets/icons/transfer-24.svg";
import { ReactComponent as GraphIcon } from "assets/icons/graph-24.svg";
import { ReactComponent as IncreaseIcon } from "assets/icons/increase-24.svg";
import { ReactComponent as TrophyIcon } from "assets/icons/trophy-24.svg";
import React from "react";

type ConnectedReferralBoxType = {
  address: string;
};

const ConnectedReferralBox = ({ address }: ConnectedReferralBoxType) => {
  const referralElements = [
    {
      Icon: WalletIcon,
      title: "Wallets",
      value: <>2</>,
    },
    {
      Icon: TransferIcon,
      title: "Transfers",
      value: <>2</>,
    },
    {
      Icon: GraphIcon,
      title: "Volume",
      value: <>2</>,
    },
    {
      Icon: IncreaseIcon,
      title: "Rate",
      value: <>2</>,
    },
    {
      Icon: TrophyIcon,
      title: "Rewards",
      value: <>2</>,
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
                  {val.value}
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
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  width: 100%;
  gap: 0;

  background: #34353b;
`;

const ReferralInfoCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 24px;
  gap: 12px;
  width: 100%;
`;

const ReferralInfoCardInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
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
`;

const ReferralInfoCardDataWrapper = styled.div`
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
`;

const Divider = styled.div`
  width: 1px;
  height: 56px;
  background: #3e4047;
`;

const DividerWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background: #34353b;

  padding: 24px 0;
`;
