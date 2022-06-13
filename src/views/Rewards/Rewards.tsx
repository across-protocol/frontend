import {
  Wrapper,
  RewardBreakdownSection,
  RewardBlockWrapper,
  RewardBlockItem,
} from "./Rewards.styles";

const Rewards = () => {
  return (
    <Wrapper>
      <RewardBreakdownSection>
        <RewardBlockWrapper>
          <RewardBlockItem>1</RewardBlockItem>
          <RewardBlockItem>1</RewardBlockItem>
        </RewardBlockWrapper>
      </RewardBreakdownSection>
    </Wrapper>
  );
};

export default Rewards;
