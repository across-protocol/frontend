import styled from "@emotion/styled";
import { ChevronLeft } from "react-feather";

import { QUERIESV2 } from "utils/constants";
import { Text } from "components/Text";

import InfoCard from "./InfoCard";
import { VerticalCardsList } from "./VerticalCardsList";

import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as EarlyBridgeIcon } from "assets/icons/plaap/bridge.svg";
import { ReactComponent as BridgeTravelerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as LPIcon } from "assets/icons/plaap/money.svg";

type Props = {
  onClickBack: () => void;
};

export function MoreInfoFlow({ onClickBack }: Props) {
  return (
    <Container data-cy="airdrop-details">
      <TitleContainer>
        <BackButton data-cy="back-button" onClick={onClickBack}>
          <ChevronLeft size={24} strokeWidth={1} />{" "}
          <Text size="xl" color="#E0F3FF">
            Back
          </Text>
        </BackButton>
        <TitleText size="3xl" color="#E0F3FF">
          Airdrop details
        </TitleText>
        <TitleDescriptionText>
          A total of 1,000,000,000 $ACX will be minted at inception and
          125,000,000 $ACX will be distributed through an airdrop to users who
          have contributed to Across.
        </TitleDescriptionText>
      </TitleContainer>

      <VerticalCardsList
        cards={[
          <InfoCard
            Icon={<DiscordIcon />}
            acxTokenAmount="20,000,000"
            title="Community Member"
            description="Community members who have meaningfully contributed to Across
            prior to the community snapshot (September 1, 2022). This
            includes a discord role-based allocation as well as a bonus
            allocation for many community members who went above and beyond."
          />,
          <InfoCard
            Icon={<BridgeTravelerIcon />}
            acxTokenAmount="10,000,000 - 20,000,000"
            title="Bridge Traveler Program"
            description="Active bridge users identified by the Bridge Traveler program
            who have not used Across prior to September 1, 2022. These users
            need to complete a bridge transfer on Across ahead of the ACX
            token launch to become eligible. The amount of ACX initially
            committed to this program is 10MM, but this amount will double
            to 20MM if a participation rate of 30% or more is achieved.
            Users who complete a bridge transfer will share these tokens
            with some allocation variability depending on past bridge
            activity."
          />,
          <InfoCard
            Icon={<EarlyBridgeIcon />}
            acxTokenAmount="15,000,000"
            title="Early Bridge User"
            description="Users who bridged assets before the Across Referral Program
            (July 18th, 2022). These tokens will be allocated to wallets
            pro-rata by the volume of transfer completed. A minimum transfer
            amount is required and a maximum airdrop size will be applied."
          />,
          <InfoCard
            Icon={<LPIcon />}
            acxTokenAmount="70,000,000"
            title="Liquidity Provider"
            description="Liquidity providers who pool ETH, USDC, WBTC or DAI into the
            Across protocol before the token launch. The amount of rewards
            to LPs are pro-rated by size and a fixed amount of tokens will
            be emitted at each block since the inception of the protocol."
          />,
        ]}
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  position: absolute;
  background: transparent;
  top: 0;
  height: 100vh;
  margin: 0 auto;
  max-width: 1600px;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
    position: relative;
    height: 100%;
  }
`;

const TitleContainer = styled.div`
  align-self: center;
  max-width: 466px;
  margin-left: 88px;

  display: flex;
  flex-direction: column;

  @media ${QUERIESV2.tb.andDown} {
    align-self: flex-start;
    margin-left: 100px;
    margin-right: 100px;
  }

  @media ${QUERIESV2.sm.andDown} {
    margin-left: 16px;
    margin-right: 16px;
    margin-bottom: 8px;
  }
`;

const TitleText = styled(Text)`
  margin-bottom: 16px;
`;

const TitleDescriptionText = styled(Text)`
  line-height: ${26 / 16}rem;
`;

const BackButton = styled.div`
  color: #e0f3ff;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 48px;

  @media ${QUERIESV2.tb.andDown} {
    margin-bottom: 24px;
  }
`;
