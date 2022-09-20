import styled from "@emotion/styled";
import { QUERIESV2, shortenAddress } from "utils";
import AirdropCard from "../AirdropCard";
import CardStepper from "../content/CardStepper";
import TitleSection from "../SplashFlow/TitleSection";
import { ReactComponent as DiscordIcon } from "assets/icons/plaap/discord.svg";
import { ReactComponent as MoneyIcon } from "assets/icons/plaap/money.svg";
import { ReactComponent as TravellerIcon } from "assets/icons/plaap/traveller.svg";
import { ReactComponent as BridgeIcon } from "assets/icons/plaap/bridge.svg";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";
import { ReactComponent as DefaultUserIcon } from "assets/icons/plaap/default-user-icon.svg";

import { RewardsApiInterface } from "utils/serverless-api/types";
interface Props {
  eligibilityLinkHandler: () => void;
  rewardsData: RewardsApiInterface;
  account: string | undefined;
}

const EligibilityFlow: React.FC<Props> = ({
  eligibilityLinkHandler,
  rewardsData,
  account,
}) => {
  return (
    <>
      <TitleSection eligibilityLinkHandler={eligibilityLinkHandler} />
      <CardTableWrapper>
        <CardWrapper>
          <AirdropCard
            title="Bridge Traveler Program"
            description="Have you bridged before but have yet to use Across? Connect your wallet to check if you’re eligible for an airdrop through the Bridge Traveler Program."
            Icon={TravellerIcon}
            check={
              rewardsData?.welcomeTravellerRewards.walletEligible
                ? "eligible"
                : "ineligible"
            }
            children={
              <CardStepper
                steps={[
                  {
                    buttonContent: <>Learn about Across</>,
                    buttonHandler: () => {},
                    stepProgress: "completed",
                    stepTitle: "Connect Discord",
                    stepIcon: <WalletIcon />,
                    completedText: "Eligible wallet",
                  },
                  {
                    buttonContent: <>Go to Bridge</>,
                    buttonHandler: () => {},
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
              rewardsData?.earlyUserRewards.walletEligible
                ? "eligible"
                : "ineligible"
            }
          />
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
                    buttonContent: <>Disconnect Discord</>,
                    buttonHandler: () => {},
                    stepProgress: "completed",
                    stepTitle: "Connect Discord",
                    stepIcon: <DefaultUserIcon />,
                    completedText: "Eligible account",
                  },
                  {
                    buttonContent: <>Unlink wallet</>,
                    buttonHandler: () => {},
                    stepProgress: "completed",
                    stepTitle: shortenAddress(account || "", "...", 4),
                    stepIcon: <WalletIcon />,
                    completedText: "Linked wallet",
                  },
                ]}
              />
            }
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
          />
        </CardWrapper>
      </CardTableWrapper>
    </>
  );
};
export default EligibilityFlow;

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
`;
