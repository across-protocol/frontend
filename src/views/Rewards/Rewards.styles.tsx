import styled from "@emotion/styled";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  background-color: #2d2e33;
  padding: 2rem;
  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    padding: 1rem 2rem;
  }
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
      height: 26px;
      width: 26px;
      margin-right: 8px;
    }
    span {
      display: inline-block;
      height: 100%;
      font-size: 1.125rem;
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

export const RewardBlockBottomRow = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  column-gap: 10px;
`;

export const RewardAmountLarge = styled.div`
  font-size: 2rem;
  color: var(--color-primary);
`;

export const RewardAmountSmall = styled.div`
  font-size: 1rem;
  color: #9daab2;
`;
