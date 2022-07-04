import { Wrapper } from "./Rewards.styles";
import { RewardReferral, RewardTableWithOverlay } from "./comp";
import Footer from "components/Footer";
import { useRewardsView } from "./useRewardsView";
import ReactTooltip from "react-tooltip";

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
      <ReactTooltip effect="solid" id="rewards" />
      <RewardReferral
        loading={isReferalSummaryLoading}
        referrer={account}
        referralsSummary={referralsSummary}
        isConnected={isConnected}
      />
      <RewardTableWithOverlay
        isConnected={isConnected}
        referrals={referrals}
        account={account || ""}
      />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
