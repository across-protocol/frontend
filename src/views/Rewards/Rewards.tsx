import { Wrapper } from "./Rewards.styles";
import { RewardBreakdown, RewardHero } from "./comp";

const Rewards = () => {
  return (
    <Wrapper>
      <RewardHero />
      <RewardBreakdown />
    </Wrapper>
  );
};

export default Rewards;
