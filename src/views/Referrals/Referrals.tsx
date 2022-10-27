import {
  Content,
  InnerContent,
  ReferralMediumWrapper,
} from "./Referrals.styles";
import {
  RewardReferral,
  RewardTableWithOverlay,
  RewardMediumBlock,
} from "./comp";
import { useReferralsView } from "./useReferralsView";
import { mediumUrl } from "utils";
import BreadcrumbV2 from "components/BreadcrumbV2";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { LayoutV2 } from "components";
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
    <LayoutV2 maxWidth={1140}>
      <Content>
        <BreadcrumbV2 />
        <InnerContent>
          <ReferralMediumWrapper>
            <RewardReferral
              loading={isReferalSummaryLoading}
              referrer={account}
              referralsSummary={referralsSummary}
              isConnected={isConnected}
            />
            {mediumUrl && <RewardMediumBlock />}
          </ReferralMediumWrapper>
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
    </LayoutV2>
  );
};

export default Referrals;
