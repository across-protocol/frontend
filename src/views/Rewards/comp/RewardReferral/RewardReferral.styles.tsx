import styled from "@emotion/styled";
import { ReactComponent as ReferralSVG } from "assets/streamline-share.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { ReactComponent as TwitterLogo } from "assets/icon-twitter.svg";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 1rem auto 1.5rem;
  padding: 1.5rem 2rem;
`;

export const ReferralRow = styled.div`
  display: flex;
  gap: 10px 15px;
`;

const ReferralRowBlock = styled.div`
  background-color: #34353b;
  border: 1px solid #3e4047;
  border-radius: 10px;
  padding: 2rem;
`;

export const ReferralLinkBlock = styled(ReferralRowBlock)`
  width: 500px;
`;

export const ReferralTierBlock = styled(ReferralRowBlock)`
  padding-top: 1rem;
  flex-grow: 2;
`;

export const IconWrapper = styled.div`
  text-align: center;
`;

export const ReferralImageWrapper = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;
export const ReferralImage = styled(ReferralSVG)`
  height: 400px;
  width: 400px;
  margin: 0 auto;
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

export const TwitterRow = styled.div`
  display: flex;
  justify-content: center;
  column-gap: 8px;
  align-items: center;
`;

export const StyledTwitterLogo = styled(TwitterLogo)`
  height: 40px;
  path {
    fill: var(--color-primary);
  }
`;

export const ShareTwitterText = styled.a`
  color: var(--color-primary);
  font-size: ${14 / 16}rem;
  font-weight: 600;
  &:hover {
    cursor: pointer;
  }
`;

export const TierInfo = styled.div`
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #3e4047;
  flex-wrap: wrap;
  row-gap: 5px;
  margin-top: 1rem;
`;

export const TierInfoItem = styled.div`
  padding-top: 8px;
  flex-basis: 40%;
  &:nth-of-type(2n) {
    text-align: right;
  }
`;
