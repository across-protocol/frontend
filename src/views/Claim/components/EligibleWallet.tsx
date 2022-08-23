import styled from "@emotion/styled";
import { useState } from "react";

import { ReactComponent as PieChartWave } from "assets/claim-pie-chart-wave.svg";

import { StepCard } from "./StepCard";
import { ClaimAirdrop, Props as ClaimAirdropProps } from "./ClaimAirdrop";
import { WaysToEarn } from "./WaysToEarn";

type Props = ClaimAirdropProps & {
  activeStepIndex: number;
};

export function EligibleWallet(props: Props) {
  const [expandedStepIndex, setExpandedStepIndex] = useState(
    props.activeStepIndex
  );

  const toggleExpandedStep = (stepIndex: number) => {
    setExpandedStepIndex((expandedStepIndex) =>
      expandedStepIndex === stepIndex ? -1 : stepIndex
    );
  };

  return (
    <Container>
      <StepCard
        stepIndex={0}
        onClickTopRow={toggleExpandedStep}
        title="Claim airdrop"
        activeStepIndex={props.activeStepIndex}
        expandedStepIndex={expandedStepIndex}
      >
        <ClaimAirdrop {...props} />
      </StepCard>
      <StepCard
        stepIndex={1}
        onClickTopRow={toggleExpandedStep}
        title="Earn more ACX"
        activeStepIndex={props.activeStepIndex}
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
  gap: 24px;
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
