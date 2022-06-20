import styled from "@emotion/styled";
import { ReactComponent as ReferralSVG } from "assets/streamline-share.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { ReactComponent as TwitterLogo } from "assets/icon-twitter.svg";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 1rem auto 1.5rem;
  /* background-color: var(--color-primary); */
  padding: 1.5rem 2rem;
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
  color: var(--color-primary);
  font-size: ${27 / 16}rem;
  margin: 0 auto;
  font-weight: 400;
  padding-bottom: 1rem;
`;

export const SubHeader = styled.h3`
  color: #c5d5e0;
  font-size: ${18 / 16}rem;
  max-width: 450px;
  text-align: center;
  font-weight: 400;
  margin: 0 auto;
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
`;

export const CopyButton = styled(SecondaryButtonWithoutShadow)`
  background-color: #2d2e33;
  color: var(--color-primary);
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-primary);
  width: 125px;
  &:hover {
    color: var(--color-white);
    border-color: var(--color-white);
  }
`;

export const TwitterRow = styled.div`
  display: flex;
  justify-content: center;
  column-gap: 8px;
  align-items: center;
`;

export const StyledTwitterLogo = styled(TwitterLogo)`
  height: 16px;
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
