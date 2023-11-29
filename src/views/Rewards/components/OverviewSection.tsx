import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";
import OverviewRewardsCard from "./OverviewRewardsCard";
import OverviewStakingCard from "./OverviewStakingCard";
import { QUERIESV2 } from "utils";

const OverviewSection = () => (
  <SectionWrapper title="Overview">
    <InnerWrapper>
      <OverviewRewardsCard />
      <OverviewStakingCard />
    </InnerWrapper>
  </SectionWrapper>
);

export default OverviewSection;

const InnerWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 16px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
  }
`;
