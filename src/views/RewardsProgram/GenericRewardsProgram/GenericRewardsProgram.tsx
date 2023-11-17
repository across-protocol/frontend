import styled from "@emotion/styled";
import { LayoutV2 } from "components";
import BreadcrumbV2 from "components/BreadcrumbV2";
import { BigNumber } from "ethers";
import { QUERIESV2, rewardProgramTypes } from "utils";
import GenericRewardClaimCard from "./GenericRewardClaimCard";
import GenericInformationCard, {
  GenericRewardInformationRowType,
} from "./GenericInformationCard";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { useGenericRewardProgram } from "../hooks/useGenericRewardProgram";
import { Referral } from "hooks/useReferrals";
import RewardTableWithOverlay from "./RewardTableWithOverlay";

type GenericRewardsProgramProps = {
  programName: string;
  program: rewardProgramTypes;
  claimCard: {
    totalRewards: BigNumber;
    availableRewards: BigNumber;
    children?: React.ReactNode;
  };
  metaCard: GenericRewardInformationRowType[];
  referralFilter: (referral: Referral) => boolean;
};

const GenericRewardsProgram = ({
  programName,
  program,
  claimCard,
  metaCard,
  referralFilter,
}: GenericRewardsProgramProps) => {
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
    totalReferrals,
    account,
    referrals,
  } = useGenericRewardProgram(referralFilter);
  return (
    <LayoutV2 maxWidth={1140}>
      <Content>
        <BreadcrumbV2 customCurrentRoute={programName} />
        <CardStack>
          <GenericRewardClaimCard
            program={program}
            children={claimCard.children}
          />
          <GenericInformationCard program={program} rows={metaCard} />
        </CardStack>
        <SectionTitleWrapperV2 title="My transfers">
          <RewardTableWithOverlay
            referrals={referrals}
            account={account || ""}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageSizes={pageSizes}
            totalReferralCount={totalReferrals}
          />
        </SectionTitleWrapperV2>
      </Content>
    </LayoutV2>
  );
};

export default GenericRewardsProgram;

const Content = styled.div`
  width: 100%;
  max-width: calc(1140px + 80px);
  padding: ${32 / 16}rem 0;
  margin: 0 auto;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;

  @media ${QUERIESV2.tb.andDown} {
    padding: ${16 / 16}rem 0rem ${48 / 16}rem;
  }

  @media ${QUERIESV2.sm.andDown} {
    padding: ${16 / 16}rem 0rem ${48 / 16}rem;
  }
`;

const CardStack = styled.div`
  display: flex;
  width: 100%;
  height: 288px;
  align-items: flex-start;
  gap: 16px;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
    align-items: flex-start;
    height: fit-content;
  }
`;
