import styled from "@emotion/styled";
import { useState } from "react";

import { ReactComponent as PieChartWave } from "assets/claim-pie-chart-wave.svg";

import { StepCard } from "./StepCard";
import { ClaimAirdrop, Props as ClaimAirdropProps } from "./ClaimAirdrop";
import { WaysToEarn } from "./WaysToEarn";

type Props = ClaimAirdropProps;

const StepIndex = {
  CLAIM: 0,
  EARN: 1,
};
const totalNumSteps = Object.keys(StepIndex).length;

export function EligibleWallet(props: Props) {
  const [expandedStepIndex, setExpandedStepIndex] = useState(StepIndex.CLAIM);

  const toggleExpandedStep = (stepIndex: number) => {
    setExpandedStepIndex((expandedStepIndex) =>
      expandedStepIndex === stepIndex
        ? (stepIndex + 1) % totalNumSteps
        : stepIndex
    );
  };

  const activeStepIndex = props.hasClaimed ? StepIndex.EARN : StepIndex.CLAIM;

  return (
    <Container>
      <StepCard
        stepIndex={StepIndex.CLAIM}
        onClickTopRow={toggleExpandedStep}
        title="Claim airdrop"
        activeStepIndex={activeStepIndex}
        expandedStepIndex={expandedStepIndex}
      >
        <ClaimAirdrop {...props} />
      </StepCard>
      <StepCard
        stepIndex={StepIndex.EARN}
        onClickTopRow={toggleExpandedStep}
        title="Earn more ACX"
        activeStepIndex={activeStepIndex}
        expandedStepIndex={expandedStepIndex}
      >
        <>
          <Step2ImageContainer>
            <PieChartWaveImage />
          </Step2ImageContainer>
          <WaysToEarn />
        </>
      </StepCard>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Step2ImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PieChartWaveImage = styled(PieChartWave)`
  height: 200px;
  width: 180px;
  margin: 48px;
  align-self: center;
  display: flex;
`;
