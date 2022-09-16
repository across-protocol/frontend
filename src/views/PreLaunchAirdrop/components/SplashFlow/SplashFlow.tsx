import styled from "@emotion/styled";
import { QUERIES } from "utils";
import AirdropCard from "../AirdropCard";
import TitleSection from "./TitleSection";
import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as MoneyIcon } from "assets/icons/plaap/money.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";

const SplashFlow = () => (
  <>
    <TitleSection />
    <CardTableWrapper>
      <CardWrapper>
        <AirdropCard
          title="Bridge Traveler Program"
          description="Have you bridged before but have yet to use Across? Connect your wallet to check if you’re eligible for an airdrop through the Bridge Traveler Program."
          Icon={TravellerIcon}
          check="undetermined"
        />
        <AirdropCard
          title="Early Bridge User"
          description="Users who bridge assets on Across before the Across Referral Program launch (July 18th, 2022) may be eligible for the $ACX airdrop."
          Icon={BridgeIcon}
          check="undetermined"
        />
      </CardWrapper>
      <CardWrapper>
        <AirdropCard
          title="Community Member"
          description="Community members can check eligibility for the ACX airdrop by connecting their Discord account. Connected members can link an Ethereum wallet to claim the airdrop."
          Icon={DiscordIcon}
          check="undetermined"
        />
        <AirdropCard
          title="Liquidity Provider"
          description="Liquidity providers who pool ETH, USDC, WBTC, and DAI into Across protocol before the token launch may be eligible for the $ACX airdrop."
          Icon={MoneyIcon}
          check="undetermined"
        />
      </CardWrapper>
    </CardTableWrapper>
  </>
);

export default SplashFlow;

const CardTableWrapper = styled.div`
  margin-top: 108px;
  display: flex;
  flex-direction: row;
  gap: 20px;

  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    margin-top: 64px;
  }

  @media ${QUERIES.mobileAndDown} {
    margin-top: 84px;
  }
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  &:last-of-type {
    margin-top: 44px;
    @media ${QUERIES.tabletAndDown} {
      margin-top: 0;
    }
  }
`;
