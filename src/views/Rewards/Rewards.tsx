import { Wrapper } from "./Rewards.styles";
import { RewardBreakdown, RewardReferral } from "./comp";
import Footer from "components/Footer";

const Rewards = () => {
  return (
    <Wrapper>
      <RewardBreakdown />
      <RewardReferral />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
