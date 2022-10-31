import { ReactComponent as AcrossWithStar } from "assets/icons/rewards/logo-within-star.svg";
import { ReactComponent as ReferralWithStar } from "assets/icons/rewards/referral-within-star.svg";
import { ReactComponent as GraphWithStar } from "assets/icons/rewards/graph-within-star.svg";
import { ReactComponent as BlueBanner } from "assets/bg-banners/blue-card-banner.svg";
import { ReactComponent as GreenBanner } from "assets/bg-banners/green-card-banner.svg";
import { ReactComponent as PurpleBanner } from "assets/bg-banners/purple-card-banner.svg";
import styled from "@emotion/styled";
import { formatEther, QUERIESV2 } from "utils";
import { BigNumber } from "ethers";

type OverviewRewardSectionType = {
  totalRewards?: BigNumber;
  stakedTokens?: BigNumber;
  referralTier?: number;
};

const referralValue = ["Copper", "Bronze", "Silver", "Gold", "Platinum"];

const OverviewRewardSection = ({
  totalRewards,
  stakedTokens,
  referralTier,
}: OverviewRewardSectionType) => {
  const referralStage = referralValue[(referralTier ?? 0) - 1];
  const cardInformation = [
    {
      title: "Total Rewards",
      value:
        totalRewards && totalRewards.gt(0)
          ? `${formatEther(totalRewards)} ACX`
          : undefined,
      Icon: AcrossWithStar,
      Banner: GreenBanner,
    },
    {
      title: "In Staked LP Tokens",
      value:
        stakedTokens && stakedTokens.gt(0)
          ? `$${formatEther(stakedTokens)}`
          : undefined,
      Icon: GraphWithStar,
      Banner: BlueBanner,
    },
    {
      title: "Referral Tier",
      value:
        referralTier && referralStage ? (
          <>
            {referralStage} <StepIcon>{referralTier}</StepIcon>{" "}
          </>
        ) : undefined,
      Icon: ReferralWithStar,
      Banner: PurpleBanner,
    },
  ];
  return (
    <Wrapper>
      {cardInformation.map((card) => (
        <CardWrapper key={card.title}>
          <BannerWrapper>
            <card.Banner />
          </BannerWrapper>
          <IconWrapper>
            <card.Icon />
          </IconWrapper>
          <CardTextWrapper>
            <CardText>{card.value ?? "-"}</CardText>
            <CardTitle>{card.title}</CardTitle>
          </CardTextWrapper>
        </CardWrapper>
      ))}
    </Wrapper>
  );
};

export default OverviewRewardSection;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 24px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    gap: 16px;
  }
`;

const CardWrapper = styled.div`
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0px;
  gap: 8px;
  isolation: isolate;
  background: #34353b;
  border: 1px solid #3e4047;
  border-radius: 12px;

  width: 100%;

  position: relative;

  overflow: clip;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: row;
    align-items: flex-start;
    padding: 24px 16px;
    gap: 16px;
  }
`;

const CardTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    align-items: flex-start;
  }
`;

const CardText = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;

  font-weight: 400;
  font-size: 26px;
  line-height: 31px;
  color: #e0f3ff;
`;

const CardTitle = styled.h3`
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #9daab2;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
  }
`;

const BannerWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

const StepIcon = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 10px 10px;
  gap: 6px;

  width: 24px;
  height: 24px;

  background: #e0f3ff;
  border: 1px solid #e0f3ff;
  border-radius: 6px;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #2d2e33;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  padding: 0;
  flex-shrink: 0;
`;
