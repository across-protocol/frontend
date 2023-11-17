import { ExternalLink, PrimaryButton, Text } from "components";
import GenericCard from "./GenericCard";
import { COLORS, QUERIESV2, rewardProgramTypes } from "utils";
import styled from "@emotion/styled";
import {
  GenericRewardClaimCardDisconnectedStateProps,
  useGenericRewardClaimCard,
} from "../hooks/useGenericRewardClaimCard";
import { ReactComponent as ClockIcon } from "assets/icons/clock.svg";
import { useState } from "react";
import { ClaimRewardsModal } from "./ClaimRewardsModal";
import { ReactComponent as ReferralSVG } from "assets/icons/rewards/referral-within-star.svg";
import { useConnection } from "hooks";

type GenericRewardClaimCardProps = {
  program: rewardProgramTypes;
  children?: React.ReactNode;
};

const GenericRewardClaimCard = ({
  program,
  children,
}: GenericRewardClaimCardProps) => {
  const {
    primaryColor,
    token,
    rewardsAmount,
    unclaimedAmount,
    rewardTokenSymbol,
    formatUnits,
    disconnectedState,
    isConnected,
  } = useGenericRewardClaimCard(program);
  const [isModalOpen, setModalOpen] = useState(false);
  return (
    <>
      <ClaimRewardsModal
        program={program}
        isOpen={isModalOpen}
        onExit={() => setModalOpen(false)}
      />
      <GenericCard program={program} displayBranding>
        {isConnected ? (
          <>
            <Header>
              <LogoContainer primaryColor={primaryColor}>
                <Logo src={token.logoURI} alt={token.symbol} />
              </LogoContainer>
              <TextStack>
                <Text color="white" size="2xl">
                  {formatUnits(rewardsAmount)} {rewardTokenSymbol}
                </Text>
                {unclaimedAmount && (
                  <ClaimableIconTextStack>
                    <ClockIcon />
                    <Text color="grey-400" size="md">
                      {formatUnits(unclaimedAmount)} {rewardTokenSymbol}{" "}
                      claimable
                    </Text>
                  </ClaimableIconTextStack>
                )}
              </TextStack>

              <StyledHandlerButton
                onClick={() => setModalOpen(true)}
                primaryColor={primaryColor}
                disabled={!unclaimedAmount || unclaimedAmount.lte(0)}
              >
                <Text color="white" size="md" weight={500}>
                  Claim
                </Text>
              </StyledHandlerButton>
            </Header>
            {children}
          </>
        ) : (
          <GenericDisconnectedFrame {...disconnectedState} />
        )}
      </GenericCard>
    </>
  );
};

export default GenericRewardClaimCard;

const GenericDisconnectedFrame = ({
  title,
  description,
  learnMoreLink,
}: GenericRewardClaimCardDisconnectedStateProps) => {
  const { connect } = useConnection();
  return (
    <DisconnectedStateWrapper>
      <StyledReferralLogo />
      <Text color="white" size="2xl">
        {title}
      </Text>
      <Text color="white" size="lg">
        {description}
      </Text>
      <ReferralLinkButtonsRow>
        <ConnectButton
          size="md"
          onClick={() => {
            connect({ trackSection: "referralTable" });
          }}
          data-cy="connect-wallet"
        >
          Connect to get started
        </ConnectButton>
        <ExternalLink href={learnMoreLink} text="Learn more" />
      </ReferralLinkButtonsRow>
    </DisconnectedStateWrapper>
  );
};

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1 0 0;
  align-self: stretch;
  gap: 16px;
`;

const Logo = styled.img`
  height: 24px;
  width: 24px;
`;

const LogoContainer = styled.div<{ primaryColor: string }>`
  // Layout
  display: flex;
  padding: 8px;
  align-items: flex-start;
  // Colors
  border-radius: 32px;
  border: 1px solid ${COLORS["grey-400-15"]};
  background: ${({ primaryColor }) =>
    COLORS[`${primaryColor}-5` as keyof typeof COLORS]};
  box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.08),
    0px 2px 6px 0px rgba(0, 0, 0, 0.08);
`;

const TextStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 0 0;
`;

const StyledHandlerButton = styled(PrimaryButton)<{ primaryColor: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;

  height: 40px;
  padding: 0px 20px;

  background: ${COLORS["black-700"]};

  border-radius: 32px;
  border: 1px solid
    ${({ primaryColor }) => COLORS[`${primaryColor}-15` as keyof typeof COLORS]};

  cursor: pointer;
`;

const ClaimableIconTextStack = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 4px;
`;

export const StyledReferralLogo = styled(ReferralSVG)`
  margin: 0 auto;
  height: 64px;
  width: 64px;
`;

export const ReferralLinkButtonsRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-top: 16px;

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
    align-items: center;
  }
`;

export const ConnectButton = styled(PrimaryButton)`
  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
    line-height: 18px;
    padding: 11px 16px;
  }
`;

const DisconnectedStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 8px;
  flex: 1 0 0;
  align-self: stretch;
`;
