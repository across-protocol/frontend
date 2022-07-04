import { Wrapper } from "./Rewards.styles";
import { RewardReferral, RewardTableWithOverlay } from "./comp";
import Footer from "components/Footer";
import { useRewardsView } from "./useRewardsView";

const Rewards = () => {
  const {
    account,
    isConnected,
    isReferalSummaryLoading,
    referralsSummary,
    referrals,
  } = useRewardsView();

  return (
    <Wrapper>
      <RewardReferral
        loading={isReferalSummaryLoading}
        referrer={account}
        referralsSummary={referralsSummary}
        isConnected={isConnected}
      />
      <RewardTableWithOverlay isConnected={isConnected} referrals={referrals} />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
