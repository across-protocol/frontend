import styled from "@emotion/styled";
import React from "react";
import { ChevronUp, ChevronDown } from "react-feather";
import { motion, AnimatePresence } from "framer-motion";

import bgImage from "assets/airdrop-waves-bg.svg";
import { Text } from "components/Text";
import { QUERIESV2 } from "utils";

import { Pill } from "./Pill";

type Props = {
  children: React.ReactElement;
  onClickTopRow: (stepIndex: number) => void;
  stepIndex: number;
  activeStepIndex: number;
  expandedStepIndex: number;
  title: string;
  SubTitle?: React.ReactElement | null;
  Icon: React.ReactElement;
  showPill?: boolean;
  isClaiming?: boolean;
  TopRowAddon?: React.ReactElement | null;
};

export function StepCard(props: Props) {
  const isExpanded = props.expandedStepIndex === props.stepIndex;
  const isStepCompleted = props.activeStepIndex > props.stepIndex;

  const Chevron = isExpanded ? ChevronUp : ChevronDown;

  const handleClickTopRow = () => {
    props.onClickTopRow(props.stepIndex);
  };

  return (
    <Container isCompleted={isStepCompleted}>
      <TopRow onClick={handleClickTopRow}>
        <CheckIconContainer isStepCompleted={isStepCompleted}>
          {props.Icon}
        </CheckIconContainer>
        <TopRowTextContainer>
          <Text size="xl" color="white-100">
            {props.title}
          </Text>
          {props.SubTitle}
        </TopRowTextContainer>
        {props.showPill && (
          <Pill backgroundColor={isStepCompleted ? "#364C4C" : "#3E4047"}>
            <Text size="xs" color={isStepCompleted ? "aqua" : "white-80"}>
              {isStepCompleted
                ? "claimed"
                : props.isClaiming
                ? "claiming..."
                : "unclaimed"}
            </Text>
          </Pill>
        )}
        <Chevron stroke="#9daab2" strokeWidth="1" />
      </TopRow>
      <AnimationContainer>
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
      </AnimationContainer>
      {props.TopRowAddon}
    </Container>
  );
}

const Container = styled.div<{ isCompleted?: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 24px;

  background: #34353b;

  border: 1px solid #3e4047;
  border-radius: 10px;

  background-image: url(${bgImage});
  background-repeat: no-repeat;
  background-size: cover;
`;

const TopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: stretch;
  gap: 12px;
  cursor: pointer;

  @media ${QUERIESV2.sm.andDown} {
    > svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const CheckIconContainer = styled.div<{ isStepCompleted?: boolean }>`
  height: 48px;
  width: 48px;

  path {
    stroke: ${({ isStepCompleted }) => (isStepCompleted ? "#6cf9d8" : "")};
  }

  path:nth-of-type(2) {
    fill: ${({ isStepCompleted }) => (isStepCompleted ? "#6cf9d8" : "")};
  }

  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
    width: 40px;
    > svg {
      height: 40px;
      width: 40px;
    }
  }
`;

const TopRowTextContainer = styled.div`
  flex: 1;
`;

const AnimationContainer = styled.div`
  width: 100%;
`;

const BodyContainer = styled.div`
  margin-top: 24px;
  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    margin-top: 16px;
  }
`;
