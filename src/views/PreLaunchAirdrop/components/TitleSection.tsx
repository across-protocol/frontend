import React from "react";
import styled from "@emotion/styled";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-right-16.svg";
import { ButtonV2 } from "components";
import { QUERIESV2 } from "utils";
import AcrossLogoAnimation from "assets/animations/lottie/across-plaap-splash-logo.json";
import LottiePlayer from "components/LottiePlayer";

type TitleSectionParams = {
  airdropDetailsLinkHandler: () => void;
  walletConnectionHandler: () => void;
  isConnected?: boolean;
};
const TitleSection = ({
  airdropDetailsLinkHandler,
  walletConnectionHandler,
  isConnected,
}: TitleSectionParams) => {
  return (
    <Wrapper>
      <StyledLottiePlayer animationData={AcrossLogoAnimation} autoplay />
      <TextStack>
        <PageHeader>ACX is about to launch.</PageHeader>
        <PageSubHeader>
          Contributors to the protocol can now check their airdrop eligibility
          and prepare for the launch. First-time Across users may be included in
          the airdrop through the Bridge Traveler Program.
        </PageSubHeader>
      </TextStack>
      <ButtonStack>
        {!isConnected && (
          <StyledButton
            data-cy="connect-wallet"
            onClick={walletConnectionHandler}
            size="lg"
          >
            Connect to check eligibility
          </StyledButton>
        )}
        <EligibilityLink
          data-cy="airdrop-details-button"
          onClick={airdropDetailsLinkHandler}
        >
          <InnerLinkText>Airdrop details</InnerLinkText>
          <StyledArrowIcon />
        </EligibilityLink>
      </ButtonStack>
    </Wrapper>
  );
};
export default TitleSection;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  text-align: center;

  width: calc(100% - 24px);

  @media ${QUERIESV2.tb.andUp} {
    max-width: calc(560px + 24px);
  }
`;

const PageHeader = styled.h1`
  font-size: 48px;
  line-height: 58px;
  font-weight: 400;
  font-style: normal;
  letter-spacing: -0.02em;
  color: #e0f3ff;
  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%),
    linear-gradient(0deg, #e0f3ff, #e0f3ff);
  background-clip: text;
  -webkit-text-fill-color: transparent;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 32px;
    line-height: 38px;
  }
`;

const ButtonStack = styled.div`
  display: flex;

  gap: 32px;

  flex-direction: row;
  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
    gap: 24px;
    align-items: center;
    justify-content: center;
  }
`;

const TextStack = styled.div`
  display: flex;
  flex-direction: column;

  gap: 16px;
`;

const PageSubHeader = styled.h2`
  color: #c5d5e0;
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 16px;
    font-weight: 500;
    line-height: 20px;
  }
`;

const EligibilityLink = styled.a`
  font-weight: 500;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
  text-decoration: none;

  cursor: pointer;

  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;

  @media ${QUERIESV2.sm.andDown} {
    font-size: 14px;
    line-height: 18px;
  }
`;

const InnerLinkText = styled.span``;

const StyledArrowIcon = styled(ArrowIcon)`
  color: #e0f3ff;
  & * {
    stroke: #e0f3ff;
  }

  @media ${QUERIESV2.sm.andDown} {
    height: 16px;
    width: 16px;
  }
`;

const StyledButton = styled(ButtonV2)`
  width: 293px;
  height: 64px;

  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%);
  box-shadow: 0px 0px 24px rgba(109, 250, 217, 0.25);
  border-radius: 32px;
  padding: 0px 40px;

  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
    width: 198px;
    padding: 0px 16px 1px;
    font-size: 14px;
    line-height: 18px;
  }
`;

// const StyledAcrossLogo = styled(AcrossRingLogo)`
//   @media ${QUERIESV2.sm.andDown} {
//     width: 315px;
//     height: 240px;
//   }
// `;

const StyledLottiePlayer = styled(LottiePlayer)`
  margin-bottom: -88px;
`;
