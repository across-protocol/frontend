import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as PlusIcon } from "assets/icons/plus-icon-16.svg";
import CardStepper from "../content/CardStepper";
import AirdropCard from "../AirdropCard";
import { RewardsApiInterface } from "utils/serverless-api/types";
import LinkWalletModal from "../LinkWalletModal";
import { useState } from "react";
import styled from "@emotion/styled";
import { formatEther, shortenAddress } from "utils";

type CommunityRewardCardProps = {
  account: string | undefined;
  connectWalletHandler: () => void;
  isConnected: boolean;
  linkWalletHandler: () => Promise<boolean>;

  discordLoginHandler: () => void;
  discordLogoutHandler: () => void;
  isDiscordAuthenticated: boolean;

  rewardsData: RewardsApiInterface;

  discordAvatar?: string;
  discordId?: string;
  discordName?: string;
  linkedWallet?: string;
  discordDetailsError: boolean;
};

const CommunityRewardCard = ({
  isConnected,
  discordLoginHandler,
  discordLogoutHandler,
  isDiscordAuthenticated,
  rewardsData,
  connectWalletHandler,
  linkWalletHandler,
  account,
  discordAvatar,
  discordName,
  linkedWallet: baseLinkedWallet,
  discordDetailsError,
}: CommunityRewardCardProps) => {
  const [displayModal, setDisplayModal] = useState(false);
  const linkedWallet = isDiscordAuthenticated ? baseLinkedWallet : undefined;

  const isWalletTheSame =
    account && linkedWallet
      ? account.toLowerCase() === linkedWallet.toLowerCase()
      : false;

  const rewards = isConnected ? rewardsData?.communityRewards : undefined;
  const walletIsLinked = linkedWallet !== undefined;
  const isEligible = rewards?.eligible ?? true;
  const payout =
    isEligible && walletIsLinked && rewards?.amount
      ? formatEther(rewards?.amount)
      : undefined;

  let stepIcon = undefined;
  if (isDiscordAuthenticated) {
    stepIcon = discordAvatar ? (
      <CustomAvatar src={discordAvatar} />
    ) : (
      <DiscordIcon />
    );
  }

  const children = isConnected ? (
    <CardStepper
      steps={[
        {
          buttonContent: isDiscordAuthenticated
            ? discordDetailsError
              ? "Reconnect"
              : "Disconnect"
            : "Connect Discord",
          buttonHandler:
            !isDiscordAuthenticated || discordDetailsError
              ? discordLoginHandler
              : discordLogoutHandler,
          stepProgress:
            isConnected && isDiscordAuthenticated
              ? discordDetailsError
                ? "failed"
                : isEligible || !rewards
                ? "completed"
                : "failed"
              : "awaiting",
          stepTitle: isDiscordAuthenticated
            ? discordDetailsError
              ? "Retry connection..."
              : isDiscordAuthenticated && discordName
              ? discordName
              : "Connecting..."
            : "Connect Discord",
          stepIcon,
          completedText: isDiscordAuthenticated
            ? discordDetailsError
              ? "Failure to load details"
              : isEligible
              ? "Eligible account"
              : "Ineligible account"
            : undefined,
        },
        {
          buttonContent: linkedWallet ? (
            isWalletTheSame ? (
              "Linked"
            ) : (
              "Change wallet"
            )
          ) : (
            <>
              Link <PlusIcon />
            </>
          ),
          buttonHandler: () => setDisplayModal(true),
          stepProgress: walletIsLinked ? "completed" : "awaiting",
          stepTitle:
            walletIsLinked && linkedWallet
              ? shortenAddress(linkedWallet, "...", 4)
              : "Link to Ethereum wallet",
          completedText: walletIsLinked ? "Linked" : undefined,
          disableButton: walletIsLinked && isWalletTheSame,
        },
      ]}
    />
  ) : null;

  let cardDescription =
    "Community members can check eligibility for the ACX airdrop by connecting their Discord account to an Ethereum wallet.";
  if (isDiscordAuthenticated && rewards) {
    if (isEligible) {
      if (walletIsLinked) {
        cardDescription =
          "Congratulations! You are eligible for the Across Community Member airdrop.";
      }
    } else {
      cardDescription =
        "This Discord account isn't eligible for the Community Member airdrop. If you have multiple accounts you could try connecting to a different one.";
    }
  }

  return (
    <>
      <AirdropCard
        boxShadowOnHover
        title="Community Member"
        description={cardDescription}
        Icon={DiscordIcon}
        check={
          isConnected && isDiscordAuthenticated
            ? discordDetailsError || (rewards && !isEligible)
              ? "ineligible"
              : "eligible"
            : "undetermined"
        }
        rewardAmount={payout}
        children={children}
      />
      <LinkWalletModal
        linkWalletHandler={linkWalletHandler}
        isConnected={isConnected}
        connectWalletHandler={connectWalletHandler}
        displayModal={displayModal}
        exitModalHandler={() => setDisplayModal(false)}
        address={account}
      />
    </>
  );
};

export default CommunityRewardCard;

const CustomAvatar = styled.img`
  border-radius: 50%;
  height: 40px;
  width: 40px;

  padding: 1px;
`;
