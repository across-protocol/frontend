import styled from "@emotion/styled";
import SectionWrapper from "components/SectionTitleWrapperV2/SectionWrapperV2";

import RewardProgramCard from "./RewardProgramCard";
import { getToken } from "utils";

const RewardProgramSection = () => {
  const tokens = ["ACX", "OP"];
  return (
    <SectionWrapper title="Reward programs">
      <InnerWrapper>
        {tokens.map((token) => (
          <RewardProgramCard token={getToken(token)} />
        ))}
      </InnerWrapper>
    </SectionWrapper>
  );
};

export default RewardProgramSection;

const InnerWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;
