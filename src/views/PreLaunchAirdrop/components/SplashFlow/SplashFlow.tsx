import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import AirdropCard from "../AirdropCard";
import TitleSection from "../TitleSection";

import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as PlusIcon } from "assets/icons/plus-icon-16.svg";
import CardStepper from "../content/CardStepper";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";
import { ReactComponent as DefaultUserIcon } from "assets/icons/plaap/default-user-icon.svg";

import { RewardsApiInterface } from "utils/serverless-api/types";
import { FlowSelector } from "views/PreLaunchAirdrop/usePreLaunchAirdrop";
import { getAccountSeenWelcomeTravellerFlow } from "utils/localStorage";
import LiquidityProviderCard from "../cards/LiquidityProviderCard";
import BridgeUserCard from "../cards/BridgeUserCard";

type SplashFlowParams = {
  airdropDetailsLinkHandler: () => void;
  connectWalletHandler: () => void;
  discordLoginHandler: () => void;
  discordLogoutHandler: () => void;
  displayLinkModal: () => void;
  isDiscordAuthenticated: boolean;
  isConnected: boolean;
  rewardsData: RewardsApiInterface;
  account: string | undefined;
  setActivePageFlow: React.Dispatch<React.SetStateAction<FlowSelector>>;
};

const SplashFlow = ({
  airdropDetailsLinkHandler,
  isConnected,
  connectWalletHandler,
  discordLoginHandler,
  discordLogoutHandler,
  displayLinkModal,
  isDiscordAuthenticated,
  account,
  rewardsData,
  setActivePageFlow,
}: SplashFlowParams) => (
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
          check={
            rewardsData?.welcomeTravellerRewards?.walletEligible
              ? "eligible"
              : "ineligible"
          }
          children={
            <CardStepper
              steps={[
                {
                  buttonContent: <>Learn about Across</>,
                  buttonHandler: () => {
                    // Check if user has seen traveller flow before
                    // TODO: Connect to data flow in different PR.
                    if (
                      account &&
                      !getAccountSeenWelcomeTravellerFlow(account)
                    ) {
                      setActivePageFlow("traveller");
                    }
                  },
                  // TODO: This flow needs to be composed to walk through these states.
                  stepProgress: "completed",
                  stepTitle: "Connect Discord",
                  stepIcon: <WalletIcon />,
                  completedText: "Eligible wallet",
                },
                {
                  buttonContent: <>Go to Bridge</>,
                  buttonHandler: () => {},
                  // TODO: This flow needs to be composed to walk through these states.
                  stepProgress: "completed",
                  stepTitle: "Bridge on Across",
                  completedText: "Completed",
                },
              ]}
            />
          }
        />
        <BridgeUserCard account={account} rewardsData={rewardsData} />
      </CardWrapper>
      <CardWrapper>
        <AirdropCard
          title="Community Member"
          description="Community members can check eligibility for the ACX airdrop by connecting their Discord account. Connected members can link an Ethereum wallet to claim the airdrop."
          Icon={DiscordIcon}
          check={
            rewardsData?.communityRewards?.walletEligible
              ? "eligible"
              : "ineligible"
          }
          children={
            <CardStepper
              steps={[
                {
                  buttonContent: isDiscordAuthenticated
                    ? "Disconnect"
                    : "Connect Discord",
                  buttonHandler: isDiscordAuthenticated
                    ? discordLogoutHandler
                    : discordLoginHandler,
                  stepProgress: isDiscordAuthenticated
                    ? "completed"
                    : "awaiting",
                  stepTitle: "Connect Discord",
                  stepIcon: isDiscordAuthenticated ? (
                    <DefaultUserIcon />
                  ) : undefined,
                },
                {
                  buttonContent: (
                    <>
                      Link <PlusIcon />
                    </>
                  ),
                  buttonHandler: displayLinkModal,
                  stepProgress: "awaiting",
                  stepTitle: "Link to Ethereum wallet",
                },
              ]}
            />
          }
        />
        <LiquidityProviderCard account={account} rewardsData={rewardsData} />
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
