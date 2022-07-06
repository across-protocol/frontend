import styled from "@emotion/styled";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { QUERIES } from "utils";
import { ReactComponent as ReferralSVG } from "assets/across-referrals.svg";
import { ReactComponent as RightUpArrow } from "assets/across-right-up-arrow.svg";
import { ReactComponent as LinkIcon } from "assets/link.svg";
import { ReactComponent as II } from "assets/info.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 1rem auto 1.5rem;
  padding: 1.5rem 0 1rem;
  @media ${QUERIES.tabletAndDown} {
    padding-top: 0.5rem;
    margin-top: 0;
  }
`;

export const ReferralRow = styled.div`
  display: flex;
  gap: 10px 15px;
  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
  }
`;

const ReferralRowBlock = styled.div`
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;
  padding: 2rem;
`;

export const ReferralLinkBlock = styled(ReferralRowBlock)`
  width: 500px;
  @media ${QUERIES.tabletAndDown} {
    width: 100%;
    background-color: transparent;
    border: none;
  }
`;

export const ReferralTierBlock = styled(ReferralRowBlock)`
  padding-top: 1rem;
  flex-grow: 2;
`;

export const IconWrapper = styled.div`
  text-align: center;
`;

export const Header = styled.h2`
  color: #e0f3ff;
  font-size: ${26 / 16}rem;
  margin: 0 auto;
  font-weight: 400;
  padding-bottom: 1rem;
  max-width: 500px;
  text-align: center;
`;

export const SubHeader = styled.h3`
  color: #c5d5e0;
  font-size: ${18 / 16}rem;
  max-width: 300px;
  text-align: center;
  font-weight: 400;
  margin: 0 auto;
  @media ${QUERIES.tabletAndDown} {
    max-width: 66%;
  }
`;

export const TierSmHeader = styled.h4`
  color: #9daab2;
  font-size: ${16 / 16}rem;
  font-weight: 400;
`;

export const TierHeader = styled.div`
  color: #e0f3ff;
  font-size: ${26 / 16}rem;
  font-weight: 400;
`;

export const CopyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 15px;
`;

export const ReferralUrl = styled.div`
  color: #9daab2;
  border: 1px solid #4c4e57;
  font-size: ${16 / 16}rem;
  text-align: center;
  border-radius: 32px;
  padding: 1rem 1.25rem;
  margin-top: 1rem;
  display: flex;
`;

export const CopyButton = styled(SecondaryButtonWithoutShadow)`
  padding: 0.33rem 0.75rem;
  font-size: ${12 / 16}rem;
  margin-left: 1rem;
  color: #34353b;
  background-color: var(--color-primary);
  text-transform: uppercase;
  font-weight: 600;
  &:hover {
    opacity: 0.7;
  }
`;

export const StyledReferralLogo = styled(ReferralSVG)`
  height: 60px;
`;

export const TierInfo = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #3e4047;
  flex-wrap: wrap;
  row-gap: 5px;
  margin-top: 1rem;
  @media ${QUERIES.mobileAndDown} {
    flex-direction: column;
    row-gap: 0;
  }
`;

export const TierInfoItem = styled.div`
  padding-top: 8px;
  flex-basis: 40%;
  color: #9daab2;
  &:nth-of-type(2n) {
    text-align: right;
    color: #e0f3ff;
  }
  @media ${QUERIES.mobileAndDown} {
    flex-basis: 100%;
    &:nth-of-type(2n) {
      text-align: left;
    }
  }
`;

export const LightGrayItemText = styled.span`
  color: #9daab2;
  margin-left: 2px;
`;

export const GreenItemText = styled.span`
  color: var(--color-primary);
`;

export const WarningInfoItem = styled.div`
  padding-top: 8px;
  flex-basis: 40%;
  color: #f9d26c;
  &:nth-of-type(2n) {
    text-align: right;
  }
  @media ${QUERIES.mobileAndDown} {
    flex-basis: 100%;
    &:nth-of-type(2n) {
      text-align: left;
    }
  }
`;

export const ConnectRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;
  row-gap: 20px;
`;

export const ConnectButton = styled(SecondaryButtonWithoutShadow)`
  background-color: var(--color-primary);
  color: #2d2e33;
  height: 40px;
  font-size: ${14 / 16}rem;
  padding: 10px;
  width: 180px;
  font-weight: 500;
`;

export const LearnMoreText = styled.div`
  color: #c5d5e0;
  font-weight: 500;
  font-size: ${16 / 16}rem;
`;
export const ArrowUpRight = styled(RightUpArrow)`
  margin-left: 4px;
`;

export const CopyIcon = styled(LinkIcon)`
  margin-left: 8px;
  cursor: pointer;
`;

export const InfoIcon = styled(II)`
  margin-left: 4px;
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
