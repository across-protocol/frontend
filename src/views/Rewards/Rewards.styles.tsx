import styled from "@emotion/styled";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";

export const Wrapper = styled.div`
  background-color: #2d2e33;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100% - 100px);
`;

export const Content = styled.div`
  width: 100%;
  max-width: calc(1140px + 80px);
  padding: ${64 / 16}rem ${40 / 16}rem;
  margin: 0 auto;

  @media screen and (max-width: 1024px) {
    padding: ${44 / 16}rem ${24 / 16}rem ${64 / 16}rem;
  }

  @media screen and (max-width: 428px) {
    padding: ${36 / 16}rem ${12 / 16}rem ${64 / 16}rem;
  }
`;

export const RewardBreakdownSection = styled.section`
  min-height: 30vh;
  width: 100%;
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
