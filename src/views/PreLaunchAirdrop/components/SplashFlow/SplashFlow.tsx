import styled from "@emotion/styled";
import { QUERIESV2, shortenAddress } from "utils";
import AirdropCard from "../AirdropCard";
import TitleSection from "../TitleSection";

import { ReactComponent as MoneyIcon } from "assets/icons/plaap/money.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";
import CardStepper from "../content/CardStepper";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";

import { RewardsApiInterface } from "utils/serverless-api/types";
import RewardsCard from "../content/RewardsCard";
import CommunityRewardCard from "../cards/CommunityRewardCard";

type SplashFlowParams = {
  airdropDetailsLinkHandler: () => void;
  connectWalletHandler: () => void;
  discordLoginHandler: () => void;
  discordLogoutHandler: () => void;
  isDiscordAuthenticated: boolean;
  isConnected: boolean;
  rewardsData: RewardsApiInterface;
  account: string | undefined;
  linkWalletHandler: () => Promise<boolean>;

  discordAvatar?: string;
  discordId?: string;
  discordName?: string;
  linkedWallet?: string;
};

const SplashFlow = ({
  airdropDetailsLinkHandler,
  isConnected,
  connectWalletHandler,
  discordLoginHandler,
  discordLogoutHandler,
  isDiscordAuthenticated,
  account,
  rewardsData,
  linkWalletHandler,
  discordAvatar,
  discordId,
  discordName,
  linkedWallet,
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
                  buttonHandler: () => {},
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
        <AirdropCard
          title="Early Bridge User"
          description="Users who bridge assets on Across before the Across Referral Program launch (July 18th, 2022) may be eligible for the $ACX airdrop."
          Icon={BridgeIcon}
          check={
            rewardsData?.earlyUserRewards?.walletEligible
              ? "eligible"
              : "ineligible"
          }
          children={
            <RewardsCard
              label="Eligible wallet"
              address={shortenAddress(account || "", "...", 4)}
              Icon={<WalletIcon />}
              bottomText="Rewards are estimated as of September 1, 2022 and are subject to
            change."
              amount="182.3445"
            />
          }
        />
      </CardWrapper>
      <CardWrapper>
        <CommunityRewardCard
          connectWalletHandler={connectWalletHandler}
          account={account}
          isConnected={isConnected}
          discordLoginHandler={discordLoginHandler}
          discordLogoutHandler={discordLogoutHandler}
          isDiscordAuthenticated={isDiscordAuthenticated}
          rewardsData={rewardsData}
          linkWalletHandler={linkWalletHandler}
          discordAvatar={discordAvatar}
          discordId={discordId}
          discordName={discordName}
          linkedWallet={linkedWallet}
        />
        <AirdropCard
          title="Liquidity Provider"
          description="Liquidity providers who pool ETH, USDC, WBTC, and DAI into Across protocol before the token launch may be eligible for the $ACX airdrop."
          Icon={MoneyIcon}
          check={
            rewardsData?.liquidityProviderRewards?.walletEligible
              ? "eligible"
              : "ineligible"
          }
          children={
            <RewardsCard
              label="Eligible wallet"
              address={shortenAddress(account || "", "...", 4)}
              Icon={<WalletIcon />}
              bottomText="Rewards are estimated as of September 1, 2022 and are subject to change.  Liquidity providers continue to earn ACX up to token launch."
              amount="2056.112"
            />
          }
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
