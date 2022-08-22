import styled from "@emotion/styled";

import { ReactComponent as AirdropGiftBackground } from "assets/airdrop-gift-bg.svg";
import { ReactComponent as ArrowTopRightIcon } from "assets/arrow-top-right.svg";

import { Card } from "./Card";
import { Button } from "../Claim.styles";
import { QUERIES } from "utils";

type Props = {
  onClickConnect?: () => void;
  isLoading?: boolean;
};

export function DisconnectedWallet(props: Props) {
  return (
    <ContainerCard>
      <BackgroundContainer>
        <AirdropGiftBackground />
      </BackgroundContainer>
      <Button size="lg" onClick={props.onClickConnect}>
        {props.isLoading
          ? "Checking your eligibility..."
          : "Connect to checkout your airdrop eligibility"}
      </Button>
      <LearnMoreLink href="/">
        Learn more about the airdrop <ExternalIcon />
      </LearnMoreLink>
    </ContainerCard>
  );
}

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
`;

const ContainerCard = styled(Card)`
  position: relative;
  height: 348px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  @media ${QUERIES.mobileAndDown} {
    height: 280px;
  }
`;

const LearnMoreLink = styled.a`
  margin-top: 24px;
  margin-bottom: 24px;
  font-weight: 500;
  font-size: ${16 / 16}rem;
  line-height: 20px;
  z-index: 10;
`;

const ExternalIcon = styled(ArrowTopRightIcon)`
  height: 12px;
  width: 12px;
`;
