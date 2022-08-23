import styled from "@emotion/styled";
import React from "react";
import { ChevronUp, ChevronDown } from "react-feather";

import { ReactComponent as CheckIcon } from "assets/check-star-ring.svg";
import { ReactComponent as CheckFilledIcon } from "assets/check-star-ring-filled.svg";

import { Card } from "./Card";

type Props = {
  children: React.ReactElement;
  onClickTopRow: (stepIndex: number) => void;
  stepIndex: number;
  activeStepIndex: number;
  expandedStepIndex: number;
  title: string;
};

export function StepCard(props: Props) {
  const isExpanded = props.expandedStepIndex === props.stepIndex;
  const isStepCompleted = props.activeStepIndex > props.stepIndex;

  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  return (
    <Container>
      <TopRow onClick={() => props.onClickTopRow(props.stepIndex)}>
        <CheckIconContainer>
          {isStepCompleted ? <CheckFilledIcon /> : <CheckIcon />}
        </CheckIconContainer>
        <TopRowTextContainer>
          <h6>Step {props.stepIndex + 1} of 2</h6>
          <h2>{props.title}</h2>
        </TopRowTextContainer>
        <Chevron stroke="#9daab2" strokeWidth="1" />
      </TopRow>
      {isExpanded && <BodyContainer>{props.children}</BodyContainer>}
    </Container>
  );
}

const Container = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const TopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: stretch;
  gap: 12px;
  cursor: pointer;
`;

const CheckIconContainer = styled.div`
  height: 48px;
  width: 48px;
`;

const TopRowTextContainer = styled.div`
  flex: 1;

  h6 {
    color: #9daab2;
  }
`;

const BodyContainer = styled.div`
  border-top: 1px solid #3e4047;
  align-self: stretch;
  margin-top: 24px;
`;
