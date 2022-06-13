import styled from "@emotion/styled";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";

export const Wrapper = styled.div`
  background-color: transparent;
`;

export const RewardBreakdownSection = styled.section`
  min-height: 30vh;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

export const RewardBlockWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: 24px;
`;

export const RewardBlockItem = styled.div`
  min-height: 200px;
  background-color: #3e4047;
  flex-basis: 45%;
  padding: 1rem 1.5rem;
`;

export const RewardsDollarSignLogo = styled(GithubLogo)`
  height: 24px;
  width: 24px;
`;

export const RewardBlockItemTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  > div:first-of-type {
    svg {
      margin-bottom: -6px;
      height: 24px;
      width: 20px;
      margin-right: 8px;
    }
    span {
      display: inline-block;
      height: 100%;
      font-size: 0.875rem;
    }
  }
`;
export const BreakdownButton = styled(SecondaryButtonWithoutShadow)`
  background-color: #34353b;
  height: 40px;
  display: flex;
  align-items: center;
  color: #c5d5e0;
  font-size: 1rem;
  svg {
    margin-left: 12px;
    height: 14px;
  }
  &:hover {
    color: var(--color-white);
  }
`;
