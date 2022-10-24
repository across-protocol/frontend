import { Content, InnerContent, Wrapper } from "./Referrals.styles";
import {
  RewardReferral,
  RewardTableWithOverlay,
  RewardMediumBlock,
} from "./comp";
import Footer from "components/Footer";
import { useReferralsView } from "./useReferralsView";
import { mediumUrl } from "utils";
import BreadcrumbV2 from "components/BreadcrumbV2";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
const Referrals = () => {
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
    totalReferralCount,
  } = useReferralsView();

  return (
    <Wrapper>
      <Content>
        <BreadcrumbV2 />
        <InnerContent>
          <RewardReferral
            loading={isReferalSummaryLoading}
            referrer={account}
            referralsSummary={referralsSummary}
            isConnected={isConnected}
          />
          {mediumUrl && <RewardMediumBlock />}
          <SectionTitleWrapperV2 title="My transfers">
            <RewardTableWithOverlay
              isConnected={isConnected}
              referrals={referrals}
              account={account || ""}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              pageSizes={pageSizes}
              totalReferralCount={totalReferralCount}
            />
          </SectionTitleWrapperV2>
        </InnerContent>
      </Content>
      <Footer />
    </Wrapper>
  );
};

export default Referrals;
