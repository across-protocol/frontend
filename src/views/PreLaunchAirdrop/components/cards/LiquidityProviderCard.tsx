import AirdropCard from "../AirdropCard";
import RewardsCard from "./RewardsCard";
import { RewardsApiInterface } from "utils/serverless-api/types";

import { ReactComponent as LPArrow } from "assets/icons/plaap/lp-arrow.svg";
import { ReactComponent as WalletIcon } from "assets/icons/wallet-icon.svg";
import { CheckIconState } from "../CardIcon";
import { formatEther } from "utils";

interface Props {
  rewardsData: RewardsApiInterface;
  account?: string;
  isConnected: boolean;
}

function useLiquidityProviderCard(
  rewardsData: RewardsApiInterface,
  isConnected: boolean
) {
  const isEligible = rewardsData?.liquidityProviderRewards?.eligible;

  const check: CheckIconState = !isConnected
    ? "undetermined"
    : isEligible
    ? "eligible"
    : "ineligible";

  const payout =
    isEligible && rewardsData?.liquidityProviderRewards?.amount
      ? formatEther(rewardsData?.liquidityProviderRewards?.amount)
      : undefined;

  return { check, payout };
}

const LiquidityProviderCard: React.FC<Props> = ({
  account,
  rewardsData,
  isConnected,
}) => {
  const { check, payout } = useLiquidityProviderCard(rewardsData, isConnected);
  return (
    <AirdropCard
      title="Liquidity Provider"
      description="Liquidity providers who pool ETH, USDC, WBTC, and DAI into Across protocol before the token launch may be eligible for the $ACX airdrop."
      Icon={LPArrow}
      check={check}
      rewardAmount={payout}
      buttonLink="/pools"
      children={
        check === "eligible" && (
          <RewardsCard
            label={
              check === "eligible" ? "Eligible wallet" : "Ineligible wallet"
            }
            address={account ?? ""}
            Icon={<WalletIcon />}
            bottomText="Rewards are estimated as of September 1, 2022 and are subject to change.  Liquidity providers continue to earn ACX up to token launch."
          />
        )
      }
    />
  );
};

export default LiquidityProviderCard;
