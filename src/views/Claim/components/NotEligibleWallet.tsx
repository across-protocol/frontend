import styled from "@emotion/styled";

import { ReactComponent as AirdropXIcon } from "assets/airdrop-x.svg";
import { ReactComponent as AirdropWavesBackground } from "assets/airdrop-waves-bg.svg";

import { Card } from "./Card";
import { WaysToEarn } from "./WaysToEarn";

export function NotEligibleWallet() {
  return (
    <Container>
      <InfoCard>
        <BackgroundContainer>
          <AirdropWavesBackground />
        </BackgroundContainer>
        <Icon />
        <Text>
          This wallet hasn't executed any of the required actions to earn an
          airdrop and thus have nothing to claim. Learn how the airdrop was
          distributed by <a href="/">visiting our FAQ</a>.
        </Text>
      </InfoCard>
      <WaysToEarnCard>
        <WaysToEarn />
      </WaysToEarnCard>
    </Container>
  );
}

const Text = styled.h6`
  z-index: 1;
  text-align: center;
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
`;

const InfoCard = styled(Card)`
  position: relative;
  height: 302px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const Icon = styled(AirdropXIcon)`
  z-index: 10;
`;

const Container = styled.div`
  flex-direction: column;
  display: flex;
  gap: 24px;
`;

const WaysToEarnCard = styled(Card)`
  padding-top: 46px;
`;
