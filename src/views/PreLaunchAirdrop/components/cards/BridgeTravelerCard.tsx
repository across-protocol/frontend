import AirdropCard from "../AirdropCard";
import { RewardsApiInterface } from "utils/serverless-api/types";

import { ReactComponent as TravelerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";
import { CheckIconState } from "../CardIcon";
import AirdropButtonGroup from "../content/AirdropButtonGroup";
import { FlowSelector } from "views/PreLaunchAirdrop/hooks/usePreLaunchAirdrop";
import CardStepper from "../content/CardStepper";
import { formatEther, shortenAddress } from "utils";
import { useHistory } from "react-router-dom";

function useBridgeTravelerCard(
  isConnected: boolean,
  rewardsData: RewardsApiInterface
) {
  const history = useHistory();

  let isWalletEligible: boolean | undefined =
    rewardsData?.welcomeTravellerRewards?.eligible;

  let isCompleted: boolean | undefined =
    rewardsData?.welcomeTravellerRewards?.completed;

  const check: CheckIconState =
    !isConnected || isWalletEligible === undefined
      ? "undetermined"
      : isWalletEligible
      ? "eligible"
      : "ineligible";

  const payout = rewardsData?.welcomeTravellerRewards?.amount
    ? formatEther(rewardsData?.welcomeTravellerRewards?.amount)
    : undefined;

  let cardDescription =
    "Have you bridged before but have yet to use Across? Connect your wallet to check if you’re eligible for an airdrop through the Bridge Traveler Program.";
  if (isConnected) {
    if (isWalletEligible !== false) {
      if (isCompleted) {
        cardDescription =
          "Congratulations, traveler! You are now eligible for the Bridge Traveler Program airdrop.";
      } else {
        cardDescription =
          "Finish the steps to become eligible for an airdrop through the Bridge Traveler Program.";
      }
    } else {
      cardDescription =
        "This wallet isn’t eligible for the airdrop. If you have multiple wallets you could try connecting to a different one.";
    }
  }
  return {
    cardDescription,
    check,
    isWalletEligible,
    isCompleted,
    payout,
    navigateToLink: (link: string) => history.push(link),
  };
}

interface Props {
  rewardsData: RewardsApiInterface;
  account?: string;
  isConnected: boolean;
  setActivePageFlow: React.Dispatch<React.SetStateAction<FlowSelector>>;
}

const BridgeTravelerCard: React.FC<Props> = ({
  isConnected,
  account,
  rewardsData,
  setActivePageFlow,
}) => {
  const { cardDescription, check, isCompleted, navigateToLink, payout } =
    useBridgeTravelerCard(isConnected, rewardsData);
  return (
    <AirdropCard
      title="Bridge Traveler Program"
      description={cardDescription}
      Icon={TravelerIcon}
      check={check}
      rewardAmount={isCompleted ? payout : undefined}
      children={
        isConnected
          ? check === "eligible" && (
              <CardStepper
                steps={[
                  {
                    buttonContent: "Learn about Across",
                    buttonHandler: () => setActivePageFlow("traveller"),
                    completedText: "Eligible wallet",
                    stepIcon: <WalletIcon />,
                    stepTitle: shortenAddress(account ?? "", "...", 4),
                    stepProgress: "completed",
                  },
                  {
                    buttonContent: "Go to Bridge",
                    buttonHandler: () => navigateToLink("/"),
                    stepTitle: "Bridge 0.1 ETH or 150 USDC",
                    stepProgress: isCompleted ? "completed" : "awaiting",
                  },
                ]}
              />
            )
          : null
      }
      contentStackChildren={
        isConnected && check === "ineligible" ? (
          <AirdropButtonGroup
            left={{
              text: "Learn about Across",
              handler: () => setActivePageFlow("traveller"),
            }}
          />
        ) : undefined
      }
    />
  );
};

export default BridgeTravelerCard;
