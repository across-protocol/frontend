import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import TitleSection from "../TitleSection";

import { RewardsApiInterface } from "utils/serverless-api/types";
import CommunityRewardCard from "../cards/CommunityRewardCard";
import LiquidityProviderCard from "../cards/LiquidityProviderCard";
import BridgeUserCard from "../cards/BridgeUserCard";
import { FlowSelector } from "views/PreLaunchAirdrop/hooks/usePreLaunchAirdrop";
import BridgeTravelerCard from "../cards/BridgeTravelerCard";

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
  discordDetailsError: boolean;
  setActivePageFlow: React.Dispatch<React.SetStateAction<FlowSelector>>;
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
  discordDetailsError,
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
        <BridgeTravelerCard
          rewardsData={rewardsData}
          isConnected={isConnected}
          account={account}
          setActivePageFlow={setActivePageFlow}
        />
        <BridgeUserCard
          account={account}
          rewardsData={rewardsData}
          isConnected={isConnected}
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
          discordDetailsError={discordDetailsError}
        />
        <LiquidityProviderCard
          account={account}
          rewardsData={rewardsData}
          isConnected={isConnected}
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

  @media ${QUERIESV2.sm.andDown} {
    gap: 16px;
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

  @media ${QUERIESV2.sm.andDown} {
    gap: 16px;
  }
`;
