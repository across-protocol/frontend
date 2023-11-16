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
import { Deposit } from "hooks/useDeposits";
import { PaginatedDepositsTable } from "components/DepositsTable";
import { useGenericRewardProgram } from "./hooks/useGenericRewardProgram";

type GenericRewardsProgramProps = {
  programName: string;
  program: rewardProgramTypes;
  claimCard: {
    totalRewards: BigNumber;
    availableRewards: BigNumber;
    children?: React.ReactNode;
  };
  metaCard: GenericRewardInformationRowType[];
  depositFilter: (deposit: Deposit) => boolean;
};

const GenericRewardsProgram = ({
  programName,
  program,
  claimCard,
  metaCard,
  depositFilter,
}: GenericRewardsProgramProps) => {
  const { deposits, offset, setOffset, pageSize, setPageSize } =
    useGenericRewardProgram(depositFilter);
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
          <PaginatedDepositsTable
            deposits={deposits}
            currentPage={offset}
            onPageChange={(p) => setOffset(p)}
            currentPageSize={pageSize}
            totalCount={deposits.length}
            onPageSizeChange={(s) => setPageSize(s)}
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
