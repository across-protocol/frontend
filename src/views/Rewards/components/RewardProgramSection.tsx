import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";

import RewardProgramCard from "./RewardProgramCard";
import { QUERIESV2, getToken, rebateTokensAvailable } from "utils";

const DesktopRewardProgramSection = () => {
  const tokens = ["ACX", ...rebateTokensAvailable];
  return (
    <SectionWrapper title="Reward programs">
      <InnerWrapper>
        {tokens.map((token) => (
          <RewardProgramCard token={getToken(token)} key={token} />
        ))}
      </InnerWrapper>
    </SectionWrapper>
  );
};

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
