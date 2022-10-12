import styled from "@emotion/styled";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { QUERIES } from "utils";

export const RewardBreakdownSection = styled.section`
  width: 100%;
`;

export const RewardBlockWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: 24px;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    margin: 0 auto;
    width: 95%;
  }
`;

export const RewardBlockItem = styled.div`
  background-color: #3e4047;
  flex-basis: 49%;
  padding: 1rem 1.5rem;
  @media ${QUERIES.tabletAndDown} {
    flex-basis: 85%;
  }
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

export const InfoButtonRow = styled.div`
  display: block;
  overflow-x: scroll;
  width: 100%;
  white-space: nowrap;

  ::-webkit-scrollbar {
    height: 6px;
  }
`;

export const InfoButton = styled(BreakdownButton)`
  border: 1px solid #9daab2;
  display: inline-block;
  margin: 0 6px;
  padding: 8px;
  svg {
    margin-left: 0;
    margin-right: 8px;
  }
  &:hover {
    span {
      color: var(--color-white);
    }
  }
`;

export const AllQuestionsButton = styled(BreakdownButton)`
  border: 1px solid #9daab2;
  display: inline-block;
  margin: 0 6px;
  padding: 8px;

  &:hover {
    span {
      color: var(--color-white);
    }
  }
`;
