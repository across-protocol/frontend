import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import AirdropCard from "../AirdropCard";
import TitleSection from "./TitleSection";
import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as MoneyIcon } from "assets/icons/plaap/money.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";
import CardStepper, { CardStepType } from "../content/CardStepper";

type SplashFlowParams = {
  airdropDetailsLinkHandler: () => void;
  connectWalletHandler: () => void;
  discordLoginHandler: () => void;
  discordLogoutHandler: () => void;
  isDiscordAuthenticated: boolean;
  isConnected: boolean;
};

const SplashFlow = ({
  airdropDetailsLinkHandler,
  isConnected,
  connectWalletHandler,
  discordLoginHandler,
  discordLogoutHandler,
  isDiscordAuthenticated,
}: SplashFlowParams) => {
  const stepper: { [key: string]: CardStepType[] } = {
    communityCard: [
      {
        buttonContent: isDiscordAuthenticated
          ? "Disconnect"
          : "Connect Discord",
        buttonHandler: isDiscordAuthenticated
          ? discordLogoutHandler
          : discordLoginHandler,
        stepProgress: isDiscordAuthenticated ? "completed" : "awaiting",
        stepTitle: "Connect Discord",
      },
      {
        buttonContent: "Link +",
        buttonHandler: discordLoginHandler,
        stepProgress: "awaiting",
        stepTitle: "Link to Ethereum wallet",
      },
    ],
  };

  return (
    <>
      <TitleSection
        isConnected={isConnected}
        walletConnectionHandler={connectWalletHandler}
        airdropDetailsLinkHandler={airdropDetailsLinkHandler}
      />
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
          >
            {isConnected && <CardStepper steps={stepper["communityCard"]} />}
          </AirdropCard>
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
};

export default SplashFlow;

const CardTableWrapper = styled.div`
  margin-top: 108px;
  display: flex;
  flex-direction: row;
  gap: 20px;

  @media ${QUERIESV2.tb.andDown} {
    flex-direction: column;
    margin-top: 64px;
  }

  @media ${QUERIESV2.sm.andUp} {
    margin-top: 84px;
  }
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  &:last-of-type {
    margin-top: 44px;
    @media ${QUERIESV2.tb.andDown} {
      margin-top: 0;
    }
  }

  @media ${QUERIESV2.tb.andDown} {
    padding-left: 16px;
    padding-right: 16px;
  }
`;
