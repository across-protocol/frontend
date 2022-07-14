import styled from "@emotion/styled";
import { ButtonV2, SecondaryButtonWithoutShadow } from "components/Buttons";
import { ReactComponent as ReferralSVG } from "assets/across-referrals.svg";
import { ReactComponent as ExternalLink12Icon } from "assets/icons/external-link-12.svg";
import { ReactComponent as LinkIcon } from "assets/link.svg";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

export const Wrapper = styled.div`
  display: flex;
  gap: 24px 24px;

  @media screen and (max-width: 1024px) {
    flex-direction: column;
  }
`;

const ReferralRowBlock = styled.div`
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;
`;

export const ReferralLinkBlock = styled(ReferralRowBlock)`
  flex: 0 0 340px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;

  @media screen and (max-width: 1024px) {
    flex: none;
    width: 100%;
    padding: 0 24px 24px;
    border: none;
    background-color: transparent;
  }

  @media screen and (max-width: 428px) {
    padding: 0 0 16px;
  }
`;

export const ReferralTierBlock = styled(ReferralRowBlock)`
  padding: ${24 / 16}rem;
  flex-grow: 2;

  @media screen and (max-width: 428px) {
    padding: ${16 / 16}rem;
  }
`;

export const Header = styled.h2`
  margin: 8px 0 12px;
  font-size: ${26 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 400;
  color: #e0f3ff;
  text-align: center;

  @media screen and (max-width: 428px) {
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

  @media screen and (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const TierSmHeader = styled.h4`
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #9daab2;

  @media screen and (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const TierHeader = styled.div`
  margin: 4px 0 0;
  color: #e0f3ff;
  font-size: ${26 / 16}rem;
  line-height: ${32 / 16}rem;
  font-weight: 400;

  @media screen and (max-width: 428px) {
    font-size: ${22 / 16}rem;
    line-height: ${26 / 16}rem;
  }
`;

export const ReferralUrl = styled.div`
  margin: 0 0 8px;
  width: 100%;
  max-width: 310px;
  display: flex;
  justify-content: space-between;
  padding: ${18 / 16}rem ${14 / 16}rem;
  font-size: ${18 / 16}rem;
  line-height: ${28 / 16}rem;
  font-weight: 400;
  text-align: center;
  color: #9daab2;
  background-color: #2d2e33;
  border: 1px solid #4c4e57;
  border-radius: 32px;

  @media screen and (max-width: 1024px) {
    padding: ${18 / 16}rem ${24 / 16}rem;
    max-width: 320px;
    margin: 0;
  }

  @media screen and (max-width: 428px) {
    max-width: 300px;
    padding: ${10 / 16}rem ${24 / 16}rem;
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
  }
`;

export const CopyButton = styled(SecondaryButtonWithoutShadow)`
  padding: 0.33rem 0.75rem;
  font-size: ${12 / 16}rem;
  color: #34353b;
  background-color: var(--color-primary);
  text-transform: uppercase;
  font-weight: 600;
  &:hover {
    opacity: 0.7;
  }
`;

export const StyledReferralLogo = styled(ReferralSVG)`
  margin: auto;
  height: 64px;
  width: 64px;
`;

export const TierInfo = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px 0 0;
  border-top: 1px solid #3e4047;
  flex-wrap: wrap;

  @media (max-width: 428px) {
    padding: 4px 0 0;
    flex-direction: column;
  }
`;

export const TierInfoItem = styled.div`
  display: flex;
  align-items: center;
  padding-top: 12px;
  width: 50%;
  color: #9daab2;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;

  &:nth-of-type(2n) {
    justify-content: flex-end;
    color: #e0f3ff;
  }

  @media (max-width: 428px) {
    width: 100%;
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;

    &:nth-of-type(2n) {
      flex-direction: row-reverse;
      padding-top: 4px;
    }

    &:nth-of-type(2n + 1) {
      padding-top: 16px;
    }
  }
`;

export const LightGrayItemText = styled.span<{ margin?: number }>`
  color: #9daab2;
  margin: ${({ margin }) => (margin ? `0 ${margin}px` : 0)};
`;

export const WarningInfoItem = styled(TierInfoItem)`
  color: #f9d26c !important;
`;

export const RewardsInfo = styled.span`
  display: flex;
  align-items: center;
  margin-right: 12px;

  svg path {
    stroke: #f9d26c;
  }
`;

export const ReferralLinkButtonsRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${40 / 16}rem;
  flex-wrap: wrap;
  gap: 16px 24px;

  @media screen and (max-width: 1024px) {
    margin-top: ${32 / 16}rem;
  }

  @media screen and (max-width: 428px) {
    flex-direction: column;
    align-items: center;
    margin-top: ${24 / 16}rem;
  }
`;

export const ConnectButton = styled(ButtonV2)`
  @media screen and (max-width: 428px) {
    font-size: 14px;
    line-height: 18px;
    padding: 11px 16px;
  }
`;

export const ExternalLinkIcon = styled(ExternalLink12Icon)`
  margin: 2px 0 0 4px;
`;

export const CopyIcon = styled(LinkIcon)`
  margin-left: 8px;
  cursor: pointer;
`;

export const InfoIcon = styled(II)`
  margin-left: 8px;
  cursor: pointer;
`;

const CM = styled(FontAwesomeIcon)`
  margin-top: 4px;
  margin-left: 8px;
  path {
    fill: var(--color-primary);
  }
`;
export const CopyCheckmark = () => <CM icon={faCheckCircle} />;

export const InlineTooltipWrapper = styled.div`
  display: inline-block;
`;

export const ExternalLink = styled.a`
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 500;
  text-decoration: none;
  color: #c5d5e0;
  transition: opacity 0.1s;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const ArrowSeparator = styled.span`
  line-height: 8px;
  margin: 4px 8px 0;
  color: #9daab2;
  transform: rotate(180deg);
`;
