import styled from "@emotion/styled";
import { ButtonV2, SecondaryButtonV2 } from "components/Buttons";
import { ReactComponent as ReferralSVG } from "assets/icons/rewards/referral-within-star.svg";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { ReactComponent as ClockIcon } from "assets/icons/clock.svg";
import { QUERIESV2 } from "utils";
import { Text } from "components/Text";

export const Wrapper = styled.div`
  display: flex;
  gap: 24px 24px;

  width: 100%;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
  }
`;

const ReferralRowBlock = styled.div`
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;

  position: relative;
`;

export const ReferralLinkBlock = styled(ReferralRowBlock)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  overflow: clip;
  flex: 0 0 340px;

  @media ${QUERIESV2.tb.andDown} {
    flex: 0;
    flex-grow: 0;
  }
`;

export const InnerReferralLinkBlock = styled.div`
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1;

  height: 100%;

  @media ${QUERIESV2.tb.andDown} {
    width: 100%;
    padding: 48px 24px 24px;
    border: none;
    background-color: transparent;
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: 32px 16px;
  }
`;

export const ReferralLinkBlockBannerWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  border: 0;
`;

export const StyledReferralCopyLink = styled.div`
  z-index: 2;
  width: 100%;
  padding: 0;
`;

export const ReferralTierBlock = styled(ReferralRowBlock)`
  padding: ${24 / 16}rem;
  flex-grow: 2;

  width: 100%;

  overflow: clip;

  display: flex;
  flex-direction: column;
  gap: ${24 / 16}rem;

  @media ${QUERIESV2.sm.andDown} {
    padding: ${16 / 16}rem;
    gap: ${16 / 16}rem;
  }
`;

export const Header = styled.h2`
  margin: 8px 0 12px;
  font-size: ${26 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 400;
  color: #e0f3ff;
  text-align: center;

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${22 / 16}rem;
    line-height: ${26 / 16}rem;
  }
`;

export const SubHeader = styled.h3`
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  text-align: center;
  font-weight: 400;
  color: #c5d5e0;

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const TierButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  gap: 8px;
`;

export const ClaimButton = styled(SecondaryButtonV2)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  & * {
    font-weight: 500 !important;
    color: #f9d26c !important;
  }
  border-color: #f9d26c;

  @media ${QUERIESV2.sm.andDown} {
    padding: 8px 16px;
  }
`;

export const TierSmHeader = styled.h4`
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #9daab2;

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const TierHeader = styled.div`
  color: #e0f3ff;
  font-size: ${26 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 400;

  @media ${QUERIESV2.sm.andDown} {
    font-size: ${22 / 16}rem;
    line-height: ${26 / 16}rem;
  }
`;

export const TierWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StyledReferralLogo = styled(ReferralSVG)`
  margin: 0 auto;
  height: 64px;
  width: 64px;
`;

export const ReferralLinkButtonsRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${40 / 16}rem;
  flex-wrap: wrap;
  gap: 16px 24px;

  @media ${QUERIESV2.tb.andDown} {
    margin-top: ${32 / 16}rem;
  }

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: center;
    margin-top: ${24 / 16}rem;
  }
`;

export const ConnectButton = styled(ButtonV2)`
  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
    line-height: 18px;
    padding: 11px 16px;
  }
`;

export const InfoIcon = styled(II)`
  cursor: pointer;
`;

export const ArrowSeparator = styled.span`
  margin-top: -4px;
  color: #9daab2;
  flex-shrink: 0;
`;

export const StatsInfoSegment = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 16px;

  overflow: clip;

  @media ${QUERIESV2.sm.andDown} {
    margin: -16px 0;
    gap: 0px;
  }
`;

export const StatsInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px 0;
  }
`;

export const StatsTitleIconTooltipWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
`;

export const StatsTitleIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 12px;

  & svg {
    @media ${QUERIESV2.sm.andDown} {
      height: ${16 / 16}rem;
      width: ${16 / 16}rem;
    }
  }
`;

export const StatsValueWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 8px;

  height: 100%;
`;

export const StatsGrayTextDesktop = styled(Text)`
  color: #9daab2;
  display: inline-block;
  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;

export const StatsGrayTextMobile = styled(StatsGrayTextDesktop)`
  color: #9daab2;
  display: none;
  @media ${QUERIESV2.sm.andDown} {
    display: inline-block;
  }
`;

export const StatsWhiteText = styled(Text)`
  color: #e0f3ff;
`;

export const MobileDivider = styled.div`
  width: 200%;
  margin-left: -50%;
  height: 1px;
  background: #3e4047;

  display: none;
  @media ${QUERIESV2.sm.andDown} {
    display: block;
  }
`;

export const RewardSecondaryTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px;
  gap: 4px;
`;

export const StyledClockIcon = styled(ClockIcon)``;
