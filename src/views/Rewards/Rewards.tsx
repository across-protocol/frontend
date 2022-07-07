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
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
  } = useRewardsView();

  return (
    <Wrapper>
      <ReactTooltip clickable effect="solid" id="rewards" />
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
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pageSizes={pageSizes}
      />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
