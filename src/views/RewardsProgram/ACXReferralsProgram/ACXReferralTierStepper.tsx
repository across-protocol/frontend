import styled from "@emotion/styled";
import { Text } from "components";
import { useConnection, useSimplifiedReferralSummary } from "hooks";
import React from "react";
import { COLORS, rewardTiers } from "utils";

const ACXReferralTierStepper = () => {
  const { account, isConnected } = useConnection();
  const {
    summary: { tier },
  } = useSimplifiedReferralSummary(account);
  return (
    <Wrapper>
      {rewardTiers.map((_, index) => (
        <React.Fragment key={`active-${index}}`}>
          <NumberedStepItem>
            <CircleStep
              status={
                isConnected
                  ? tier < 5 && index === tier - 1
                    ? "half"
                    : index < tier
                    ? "full"
                    : "empty"
                  : "empty"
              }
            />
            <Text size="lg" color={index < tier ? "white" : "grey-400"}>
              {index + 1}
            </Text>
          </NumberedStepItem>
          {index < rewardTiers.length - 1 && <HorizontalLine />}
        </React.Fragment>
      ))}
    </Wrapper>
  );
};

export default ACXReferralTierStepper;

const Wrapper = styled.div`
  display: flex;
  padding: 4px 0px;
  gap: 0;
  align-items: center;
  justify-content: space-between;
  align-self: stretch;
  width: 100%;

  position: relative;
`;

const HorizontalLine = styled.div`
  flex: 1 0 0;
  height: 1px;
  background-color: ${COLORS["aqua-15"]};
`;

const NumberedStepItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;

  width: 40px;
  height: 40px;
  flex-shrink: 0;

  border: 1px solid ${COLORS["aqua-15"]};
  border-radius: 50%;
`;

const CircleStep = styled.div<{ status: "empty" | "half" | "full" }>`
  position: absolute;

  width: 40px;
  height: 40px;
  top: -1px;
  left: -1px;
  border: 1px solid ${COLORS["white"]};
  border-radius: 50%;

  /* 
   * If the status is empty, we should not render the circle at all.
   * If the status is half, we should render a half circle from left to right
   * If the status is full, we should render a full circle 
   */
  display: ${({ status }) => (status === "empty" ? "none" : "block")};
  clip-path: ${({ status }) =>
    status === "half" ? "inset(0 50% 0 0)" : "none"};
`;
