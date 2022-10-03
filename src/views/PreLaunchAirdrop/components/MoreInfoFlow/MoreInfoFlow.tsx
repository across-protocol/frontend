import styled from "@emotion/styled";
import { ChevronLeft } from "react-feather";

import AirdropCard from "views/PreLaunchAirdrop/components/AirdropCard";
import CardTextDescription from "views/PreLaunchAirdrop/components/content/CardTextDescription";
import { VerticalCardsList } from "../VerticalCardsList";
import { QUERIESV2 } from "utils/constants";

import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as EarlyBridgeIcon } from "assets/icons/plaap/bridge.svg";
import { ReactComponent as BridgeTravelerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as LPIcon } from "assets/icons/plaap/money.svg";

type Props = {
  onClickBack: () => void;
};

export function MoreInfoFlow({ onClickBack }: Props) {
  return (
    <Container>
      <TitleContainer>
        <BackButton onClick={onClickBack}>
          <ChevronLeft size={24} strokeWidth={1} /> Back
        </BackButton>
        <h3>Airdrop details</h3>
        <p>
          A total of 1,000,000,000 $ACX will be minted at inception and
          120,000,000 $ACX will be distributed through an airdrop to users who
          have contributed to Across.
        </p>
      </TitleContainer>

      <VerticalCardsList
        cards={[
          <AirdropCard
            Icon={DiscordIcon}
            acxTokenAmount="25,000,000"
            title="Community Member"
            hideBoxShadow
          >
            <CardTextDescription>
              Community members who have meaningfully contributed to Across
              prior to the community snapshot (September 1, 2022). This includes
              a discord role-based allocation as well as a bonus allocation for
              many community members who went above and beyond.
            </CardTextDescription>
          </AirdropCard>,
          <AirdropCard
            Icon={BridgeTravelerIcon}
            acxTokenAmount="10,000,000 - 20,000,000"
            title="Bridge Traveler Program"
            hideBoxShadow
          >
            <CardTextDescription>
              Active bridge users who have not used Across prior to the Across
              Referral Program (July 18, 2022) identified by the Bridge Traveler
              program. These users need to complete a bridge transfer on Across
              ahead of the ACX token launch to become eligible. The amount of
              ACX initially committed to this program is 10MM, but this amount
              will double to 20MM if a participation rate of 30% or more is
              achieved. Users who complete a bridge transfer will share these
              tokens with some allocation variability depending on past bridge
              activity.
            </CardTextDescription>
          </AirdropCard>,
          <AirdropCard
            Icon={EarlyBridgeIcon}
            acxTokenAmount="15,000,000"
            title="Early Bridge User"
            hideBoxShadow
          >
            <CardTextDescription>
              Users who bridged assets before the Across Referral Program (July
              18th, 2022). These tokens will be allocated to wallets pro-rata by
              the volume of transfer completed. A minimum transfer amount is
              required and a maximum airdrop size will be applied.
            </CardTextDescription>
          </AirdropCard>,
          <AirdropCard
            Icon={LPIcon}
            acxTokenAmount="70,000,000"
            title="Liquidity Provider"
            hideBoxShadow
          >
            <CardTextDescription>
              Liquidity providers who pool ETH, USDC, WBTC or DAI into the
              Across protocol before the token launch. The amount of rewards to
              LPs are pro-rated by size and a fixed amount of tokens will be
              emitted at each block since the inception of the protocol.
            </CardTextDescription>
          </AirdropCard>,
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
  margin-top: -48px;
  margin-left: 88px;

  display: flex;
  flex-direction: column;

  h3 {
    font-size: ${32 / 16}rem;
    line-height: ${38 / 16}rem;
    font-weight: 400;
    margin-bottom: 16px;
    color: #e0f3ff;
  }

  p {
    color: #c5d5e0;
  }

  @media ${QUERIESV2.tb.andDown} {
    align-self: flex-start;
    margin-left: 100px;
    margin-right: 100px;
    max-width: 800px;
  }

  @media ${QUERIESV2.sm.andDown} {
    margin-left: 16px;
    margin-right: 16px;
    margin-bottom: 8px;
  }
`;

const BackButton = styled.div`
  font-size: ${22 / 16}rem;
  line-height: ${26 / 16}rem;
  font-weight: 400;
  color: #e0f3ff;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 48px;
`;
