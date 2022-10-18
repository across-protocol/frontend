import styled from "@emotion/styled";
import { useState } from "react";

import { ReactComponent as XStarRing } from "assets/x-star-ring.svg";
import { ReactComponent as PlusStarRing } from "assets/plus-star-ring.svg";
import { QUERIESV2 } from "utils/constants";

import { StepCard } from "./StepCard";
import { ClaimAirdrop, Props as ClaimAirdropProps } from "./ClaimAirdrop";
import { WaysToEarn } from "./WaysToEarn";
import { WalletHero } from "./WalletHero";

type Props = ClaimAirdropProps;

const StepIndex = {
  CLAIM: 0,
  EARN: 1,
};
const totalNumSteps = Object.keys(StepIndex).length;

export function EligibleWalletFlow(props: Props) {
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
      <WalletHero
        title="Eligible wallet"
        subTitle={
          <>
            Claim your airdrop and find more ways to earn ACX below.
            <br />
            Learn more about the airdrop details here.
          </>
        }
        eligible
      />
      <StepCard
        stepIndex={StepIndex.CLAIM}
        onClickTopRow={toggleExpandedStep}
        title="Claim airdrop"
        activeStepIndex={activeStepIndex}
        expandedStepIndex={expandedStepIndex}
        Icon={<XStarRing />}
        showPill
      >
        <ClaimAirdrop {...props} />
      </StepCard>
      <StepCard
        stepIndex={StepIndex.EARN}
        onClickTopRow={toggleExpandedStep}
        title="Earn more ACX"
        activeStepIndex={activeStepIndex}
        expandedStepIndex={expandedStepIndex}
        Icon={<PlusStarRing />}
      >
        <WaysToEarn />
      </StepCard>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  color: #e0f3ff;

  max-width: 600px;
  width: 100%;

  @media (max-width: 630px) {
    padding-left: 16px;
    padding-right: 16px;
  }

  @media ${QUERIESV2.sm.andDown} {
    margin: 48px auto;
  }
`;
