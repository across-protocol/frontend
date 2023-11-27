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
import GenericConnectToWallet from "./GenericConnectToWallet";
import { PaginatedDepositsTable } from "components/DepositsTable";

type GenericRewardsProgramProps = {
  programName: string;
  program: rewardProgramTypes;
  claimCard: {
    totalRewards: BigNumber;
    availableRewards: BigNumber;
    children?: React.ReactNode;
  };
  metaCard: GenericRewardInformationRowType[];
};

const GenericRewardsProgram = ({
  programName,
  program,
  claimCard,
  metaCard,
}: GenericRewardsProgramProps) => {
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
    totalReferrals,
    referrals,
    isConnected,
  } = useGenericRewardProgram(program);
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
          {isConnected ? (
            <TableWrapper>
              <PaginatedDepositsTable
                deposits={referrals}
                onPageChange={setCurrentPage}
                currentPage={currentPage}
                pageSizes={pageSizes}
                onPageSizeChange={setPageSize}
                currentPageSize={pageSize}
                totalCount={totalReferrals}
                onClickSpeedUp={() => {}}
                initialPageSize={pageSize}
              />
            </TableWrapper>
          ) : (
            <GenericConnectToWallet programName={programName} />
          )}
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

const TableWrapper = styled.div`
  max-width: 100%;
  overflow-x: scroll;
`;
