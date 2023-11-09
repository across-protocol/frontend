import BreadcrumbV2 from "components/BreadcrumbV2";
import SectionWrapper from "../../components/SectionTitleWrapperV2/SectionWrapperV2";
import { useRewards } from "./hooks/useRewards";
import { InnerSectionWrapper, Wrapper } from "./Rewards.style";
import GenericStakingPoolTable from "./components/GenericStakingPoolTable/GenericStakingPoolTable";
import { LayoutV2 } from "components";
import useScrollElementByHashIntoView from "hooks/useScrollElementByHashIntoView";
import AdditionalQuestionCTA from "./components/AdditionalQuestionCTA";
import OverviewSection from "./components/OverviewSection";
import RewardProgramSection from "./components/RewardProgramSection";

const Rewards = () => {
  const { isConnected, areStakingPoolsLoading, myPoolData, allPoolData } =
    useRewards();

  useScrollElementByHashIntoView();

  return (
    <LayoutV2 maxWidth={1140}>
      <Wrapper>
        <BreadcrumbV2 />
        <InnerSectionWrapper>
          <OverviewSection />
          {isConnected && (areStakingPoolsLoading || myPoolData.length > 0) && (
            <SectionWrapper title="My pools" id="my-pools">
              <GenericStakingPoolTable
                poolData={myPoolData}
                isLoading={areStakingPoolsLoading}
              />
            </SectionWrapper>
          )}
          {(areStakingPoolsLoading || allPoolData.length > 0) && (
            <SectionWrapper title="All pools">
              <GenericStakingPoolTable
                greyscaleTokenLogo={isConnected}
                poolData={allPoolData}
                isLoading={areStakingPoolsLoading}
              />
            </SectionWrapper>
          )}
          <RewardProgramSection />
          <AdditionalQuestionCTA />
        </InnerSectionWrapper>
      </Wrapper>
    </LayoutV2>
  );
};

export default Rewards;
