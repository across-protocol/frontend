import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";
import OverviewRewardsCard from "./OverviewRewardsCard";
import OverviewStakingCard from "./OverviewStakingCard";

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
`;
