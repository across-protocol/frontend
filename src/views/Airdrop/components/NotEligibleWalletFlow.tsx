import styled from "@emotion/styled";

import { QUERIESV2 } from "utils/constants";
import bgImage from "assets/airdrop-waves-bg.svg";
import { Text } from "components/Text";

import { WaysToEarn } from "./WaysToEarn";
import { WalletHero } from "./WalletHero";

export function NotEligibleWalletFlow() {
  return (
    <Container>
      <WalletHero
        title="Ineligible wallet"
        subTitle={
          <>
            This wallet hasn't executed any of the required actions to earn an
            airdrop. Learn more about the airdrop distribution{" "}
            <Link href="" target="_blank" rel="noreferrer">
              here
            </Link>
            .
          </>
        }
      />
      <CardContainer>
        <Title size="2xl" color="white-100">
          More ways to earn ACX
        </Title>
        <WaysToEarn />
      </CardContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;

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

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;

  border: 1px solid #3e4047;
  border-radius: 10px;

  background-image: url(${bgImage});
  background-repeat: no-repeat;
  background-size: cover;
`;

const Title = styled(Text)`
  text-align: center;
`;

const Link = styled.a`
  text-decoration: underline;
`;
