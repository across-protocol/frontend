import styled from "@emotion/styled";
import { LayoutV2 } from "components";
import BreadcrumbV2 from "components/BreadcrumbV2";
import { BigNumber } from "ethers";
import { useQueryClient } from "react-query";
import { QUERIESV2, rewardProgramTypes } from "utils";
import GenericRewardClaimCard from "./GenericRewardClaimCard";
import GenericInformationCard, {
  GenericRewardInformationRowType,
} from "./GenericInformationCard";
import SectionTitleWrapperV2 from "components/SectionTitleWrapperV2";
import { useGenericRewardProgram } from "../hooks/useGenericRewardProgram";
import { PaginatedDepositsTable } from "components/DepositsTable";
import GenericEmptyTable from "./GenericEmptyTable";
import React, { useRef } from "react";

type GenericRewardsProgramProps = {
  programName: string;
  program: rewardProgramTypes;
  claimCard: {
    totalRewards: BigNumber;
    availableRewards: BigNumber;
    children?: React.ReactNode;
  };
  metaCard: GenericRewardInformationRowType[];
  Banner?: React.ReactNode;
};

const GenericRewardsProgram = ({
  programName,
  program,
  claimCard,
  metaCard,
  Banner,
}: GenericRewardsProgramProps) => {
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    pageSizes,
    rewardsQuery,
    isConnected,
    connect,
  } = useGenericRewardProgram(program);
  const metaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const deposits = rewardsQuery.data?.deposits || [];
  const depositsCount = rewardsQuery.data?.pagination.total || 0;

  const showEmptyTable =
    !isConnected ||
    rewardsQuery.isError ||
    rewardsQuery.isLoading ||
    deposits.length === 0;

  return (
    <LayoutV2 maxWidth={1140}>
      <Content>
        {Banner && <BannerWrapper>{Banner}</BannerWrapper>}
        <BreadcrumbV2 customCurrentRoute={programName} />
        <CardStack>
          <CardWrapper height={metaRef?.current?.offsetHeight}>
            <GenericRewardClaimCard
              program={program}
              children={claimCard.children}
            />
          </CardWrapper>
          <CardWrapper ref={metaRef}>
            <GenericInformationCard program={program} rows={metaCard} />
          </CardWrapper>
        </CardStack>
        <SectionTitleWrapperV2 title="My transfers">
          {showEmptyTable ? (
            <GenericEmptyTable
              programName={programName}
              isConnected={isConnected}
              isLoading={rewardsQuery.isLoading}
              isError={rewardsQuery.isError}
              isEmpty={deposits.length === 0}
              onClickConnect={() => {
                connect({ trackSection: "referralTable" });
              }}
              onClickReload={async () => {
                await queryClient.cancelQueries({ queryKey: [programName] });
                await queryClient.resetQueries({ queryKey: [programName] });
                rewardsQuery.refetch();
              }}
            />
          ) : (
            <TableWrapper data-cy="rewards-table">
              <PaginatedDepositsTable
                deposits={deposits}
                onPageChange={setCurrentPage}
                currentPage={currentPage}
                pageSizes={pageSizes}
                onPageSizeChange={setPageSize}
                currentPageSize={pageSize}
                totalCount={depositsCount}
                initialPageSize={pageSize}
                disabledColumns={["actions", "bridgeFee"]}
              />
            </TableWrapper>
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
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CardWrapper = styled.div<{ height?: number }>`
  height: fit-content;
  width: 100%;
  @media ${QUERIESV2.tb.andUp} {
    height: ${({ height }) => (height ? `${height}px` : "fit-content")};
  }
`;

const BannerWrapper = styled.div`
  margin-bottom: 40px;
  width: 100%;
`;
