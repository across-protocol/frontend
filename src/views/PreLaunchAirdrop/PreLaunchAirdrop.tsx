import Footer from "components/Footer";
import { TitleSection } from "./components";
import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as MoneyIcon } from "assets/icons/plaap/money.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";

import {
  BackgroundLayer,
  CardTableWrapper,
  CardWrapper,
  ContentWrapper,
  Wrapper,
} from "./PreLaunchAirdrop.styles";
import AirdropCard from "./components/AirdropCard";

const PreLaunchAirdrop = () => {
  return (
    <Wrapper>
      <BackgroundLayer />
      <ContentWrapper>
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
      </ContentWrapper>
      <Footer />
    </Wrapper>
  );
};

export default PreLaunchAirdrop;
