import styled from "@emotion/styled";
import { useState, useEffect } from "react";
import { ChevronRight } from "react-feather";
import { Link } from "react-router-dom";

import { ReactComponent as XStarRing } from "assets/x-star-ring.svg";
import { ReactComponent as PlusStarRing } from "assets/plus-star-ring.svg";
import { ReactComponent as HelpIcon } from "assets/icons/help-24.svg";

import { QUERIESV2 } from "utils/constants";
import { Text } from "components/Text";

import { StepCard } from "./StepCard";
import { ClaimAirdrop, Props as ClaimAirdropProps } from "./ClaimAirdrop";
import { WaysToEarn } from "./WaysToEarn";
import { WalletHero } from "./WalletHero";
import { formatUnits } from "utils";
import { LinkSpanWithUnderline, HighlightedLink } from "../Airdrop.styles";

type Props = ClaimAirdropProps & {
  currentApyPct?: number | string;
};

const StepIndex = {
  CLAIM: 0,
  EARN: 1,
};
const totalNumSteps = Object.keys(StepIndex).length;

export function EligibleWalletFlow(props: Props) {
  const [expandedStepIndex, setExpandedStepIndex] = useState(StepIndex.CLAIM);

  useEffect(() => {
    if (props.isClaiming) {
      setExpandedStepIndex(StepIndex.EARN);
    }
  }, [props.isClaiming]);

  const toggleExpandedStep = (stepIndex: number) => {
    setExpandedStepIndex((expandedStepIndex) =>
      expandedStepIndex === stepIndex
        ? (stepIndex + 1) % totalNumSteps
        : stepIndex
    );
  };

  const activeStepIndex = props.hasClaimed ? StepIndex.EARN : StepIndex.CLAIM;

  const claimAmount = props.amount ? formatUnits(props.amount, 18) : "-";

  return (
    <Container>
      <WalletHero
        title="Eligible wallet"
        subTitle={
          <>
            Claim your airdrop and find more ways to earn ACX below.
            <br />
            Learn more about the airdrop details{" "}
            <LinkSpanWithUnderline onClick={props.onClickInfoLink}>
              here
            </LinkSpanWithUnderline>
            .
          </>
        }
        eligible
      />
      <StepCard
        stepIndex={StepIndex.CLAIM}
        onClickTopRow={toggleExpandedStep}
        title="Claim tokens"
        SubTitle={
          !props.hasClaimed ? (
            <Text size="lg">{claimAmount} ACX</Text>
          ) : (
            <SubTitleContainer>
              <Text size="lg" color="aqua">
                {claimAmount} ACX
              </Text>
              <EarningsContainer>
                <Text size="lg" color="white-70">
                  ·
                </Text>
                <Text size="lg" color="white-70">
                  Earning:
                </Text>
                <Text size="lg" color="white-100">
                  {props.currentApyPct ?? "-"}% APY
                </Text>
              </EarningsContainer>
            </SubTitleContainer>
          )
        }
        activeStepIndex={activeStepIndex}
        expandedStepIndex={expandedStepIndex}
        Icon={<XStarRing />}
        showPill
        isClaiming={props.isClaiming}
        TopRowAddon={
          props.hasClaimed ? (
            <TopRowAddonContainer>
              <HelpIcon />
              <TextContainer>
                <Text color="white-100">
                  Visit{" "}
                  <HighlightedLink to={"/rewards"}>Rewards</HighlightedLink> to
                  find your claimed tokens and track all rewards generated from
                  activities on Across.
                </Text>
              </TextContainer>
              <IconButtonLink to="/rewards">
                <ChevronRight stroke="#6CF9D8" strokeWidth="1.5" size={20} />
              </IconButtonLink>
            </TopRowAddonContainer>
          ) : null
        }
      >
        <ClaimAirdrop {...props} />
      </StepCard>
      <StepCard
        stepIndex={StepIndex.EARN}
        onClickTopRow={toggleExpandedStep}
        title="More ways to earn ACX"
        activeStepIndex={activeStepIndex}
        expandedStepIndex={expandedStepIndex}
        Icon={<PlusStarRing />}
      >
        <WaysToEarn maxApyPct={props.maxApyPct} />
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

const TopRowAddonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 14px;
  align-self: stretch;
  margin-top: 24px;
  background: rgba(108, 249, 216, 0.05);
  border: 1px solid rgba(108, 249, 216, 0.1);
  border-radius: 12px;
  padding: 16px;

  > svg {
    margin-top: 4px;
  }
`;

const TextContainer = styled.div`
  flex: 1;
`;

const IconButtonLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  border: 1px solid #6cf9d8;
  border-radius: 100%;
  align-self: center;
  justify-self: flex-end;
`;

const SubTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const EarningsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding-left: 4px;

  @media ${QUERIESV2.sm.andDown} {
    display: none;
  }
`;
