import styled from "@emotion/styled";
import React from "react";
import { ChevronUp, ChevronDown } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";

import { ReactComponent as CheckIcon } from "assets/check-star-ring.svg";
import { ReactComponent as CheckFilledIcon } from "assets/check-star-ring-filled.svg";

import { Card } from "./Card";
import { QUERIESV2 } from "utils";

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

  const handleClickTopRow = () => {
    props.onClickTopRow(props.stepIndex);
  };

  return (
    <Container>
      <TopRow onClick={handleClickTopRow}>
        <CheckIconContainer>
          {isStepCompleted ? <CheckFilledIcon /> : <CheckIcon />}
        </CheckIconContainer>
        <TopRowTextContainer>
          <h6>Step {props.stepIndex + 1} of 2</h6>
          <h2>{props.title}</h2>
        </TopRowTextContainer>
        <Chevron stroke="#9daab2" strokeWidth="1" />
      </TopRow>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { height: "auto", opacity: 1 },
              collapsed: { height: 0, opacity: 0 },
            }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          >
            <BodyContainer>{props.children}</BodyContainer>
          </motion.div>
        )}
      </AnimatePresence>
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

  h6 {
    margin-bottom: 4px;
  }

  @media ${QUERIESV2.sm} {
    h6 {
      margin-bottom: 0;
    }

    > svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const CheckIconContainer = styled.div`
  height: 48px;
  width: 48px;

  @media ${QUERIESV2.sm} {
    height: 40px;
    width: 40px;
  }
`;

const TopRowTextContainer = styled.div`
  flex: 1;

  h6 {
    color: #9daab2;
  }
`;

const BodyContainer = styled.div`
  border-top: 1px solid #3e4047;
  margin-top: 24px;

  @media ${QUERIESV2.sm} {
    margin-top: 16px;
  }
`;
