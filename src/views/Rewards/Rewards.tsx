import { Wrapper } from "./Rewards.styles";
import { RewardReferral, RewardTableWithOverlay } from "./comp";
import Footer from "components/Footer";
import { useConnection } from "state/hooks";

const Rewards = () => {
  const { isConnected } = useConnection();

  return (
    <Wrapper>
      <RewardReferral isConnected={isConnected} />
      <RewardTableWithOverlay />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
