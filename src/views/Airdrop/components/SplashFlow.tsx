import styled from "@emotion/styled";

import { UnstyledButton } from "components/Button";
import { Text } from "components/Text";
import LottiePlayer from "components/LottiePlayer";
import { QUERIESV2 } from "utils";

import { ReactComponent as ArrowIcon } from "assets/icons/arrow-right-16.svg";
import AcrossLogoAnimation from "assets/animations/lottie/across-plaap-splash-logo.json";

type Props = {
  airdropDetailsLinkHandler: () => void;
  connectWalletHandler: () => void;
  isConnecting?: boolean;
};

export const SplashFlow = ({
  airdropDetailsLinkHandler,
  isConnecting,
  connectWalletHandler,
}: Props) => (
  <Wrapper>
    <LottiePlayer animationData={AcrossLogoAnimation} autoplay />
    <PageHeader size="4xl">The ACX token is now live.</PageHeader>
    <ButtonStack>
      <StyledButton
        data-cy="connect-wallet"
        onClick={connectWalletHandler}
        size="lg"
        disabled={isConnecting}
      >
        {isConnecting
          ? "Checking eligibility..."
          : "Connect to check eligibility"}
      </StyledButton>
      <EligibilityLink
        data-cy="airdrop-details-button"
        onClick={airdropDetailsLinkHandler}
      >
        <Text size="lg" weight={500}>
          Airdrop details
        </Text>
        <StyledArrowIcon />
      </EligibilityLink>
    </ButtonStack>
  </Wrapper>
);

export default SplashFlow;

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

const PageHeader = styled(Text)`
  letter-spacing: -0.02em;
  color: #e0f3ff;
  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%),
    linear-gradient(0deg, #e0f3ff, #e0f3ff);
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-top: -48px;
`;

const ButtonStack = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media ${QUERIESV2.tb.andDown} {
    gap: 24px;
  }
`;

const EligibilityLink = styled.a`
  color: #e0f3ff;
  text-decoration: none;

  cursor: pointer;

  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

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

const StyledButton = styled(UnstyledButton)`
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
  }
`;
