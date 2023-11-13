import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";

import RewardProgramCard from "./RewardProgramCard";
import {
  QUERIESV2,
  getToken,
  rewardProgramsAvailable,
  rewardPrograms,
} from "utils";

const DesktopRewardProgramSection = () => (
  <SectionWrapper title="Reward programs">
    <InnerWrapper>
      {rewardProgramsAvailable.map((program) => (
        <RewardProgramCard
          token={getToken(rewardPrograms[program].rewardTokenSymbol)}
          key={rewardPrograms[program].rewardTokenSymbol}
        />
      ))}
    </InnerWrapper>
  </SectionWrapper>
);

export default DesktopRewardProgramSection;

const InnerWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
  }
`;
