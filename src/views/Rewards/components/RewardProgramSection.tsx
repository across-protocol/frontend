import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";

import RewardProgramCard from "./RewardProgramCard";
import { QUERIESV2, rewardProgramsAvailable, rewardPrograms } from "utils";

const DesktopRewardProgramSection = () => (
  <SectionWrapper title="Reward programs">
    <InnerWrapper halfWidth={rewardProgramsAvailable.length === 1}>
      {rewardProgramsAvailable.map((program) => (
        <RewardProgramCard
          program={program}
          key={rewardPrograms[program].rewardTokenSymbol}
        />
      ))}
    </InnerWrapper>
  </SectionWrapper>
);

export default DesktopRewardProgramSection;

const InnerWrapper = styled.div<{ halfWidth: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
  }

  @media ${QUERIESV2.tb.andUp} {
    ${({ halfWidth }) => halfWidth && `width: 50%;`}
  }
`;
