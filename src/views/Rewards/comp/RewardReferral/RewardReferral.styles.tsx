import styled from "@emotion/styled";
import { ReactComponent as ReferralSVG } from "assets/streamline-share.svg";

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
