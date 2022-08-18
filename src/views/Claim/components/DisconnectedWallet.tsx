import styled from "@emotion/styled";

import AirdropBackground from "assets/airdrop-gift-bg.svg";
import { ExternalLink } from "components/ExternalLink";

import { Card } from "./Card";
import { Button } from "../Claim.styles";
import { QUERIESV2 } from "utils";

type Props = {
  onClickConnect?: () => void;
  isCheckingEligibility?: boolean;
};

export function DisconnectedWallet(props: Props) {
  return (
    <ContainerCard>
      <Button
        size="lg"
        onClick={props.onClickConnect}
        disabled={props.isCheckingEligibility}
      >
        {props.isCheckingEligibility
          ? "Checking your eligibility..."
          : "Connect to check eligibility"}
      </Button>
      <LinkContainer>
        <ExternalLink href="/" text="Learn more about the airdrop" />
      </LinkContainer>
    </ContainerCard>
  );
}

const ContainerCard = styled(Card)`
  background-position: center;
  background-image: url(${AirdropBackground});
  background-size: cover;

  height: 348px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  @media ${QUERIESV2.sm} {
    height: 280px;
  }
`;

const LinkContainer = styled.div`
  margin-top: 24px;
  margin-bottom: 24px;
  z-index: 10;
`;
