import React, { useMemo, useState } from "react";
import CopyReferralLink from "components/CopyReferralLink";
import {
  Wrapper,
  Header,
  SubHeader,
  ReferralLinkButtonsRow,
  StyledReferralLogo,
  ReferralLinkBlock,
  ReferralTierBlock,
  TierSmHeader,
  TierHeader,
  ConnectButton,
  InfoIcon,
  ReferralLinkBlockBannerWrapper,
  InnerReferralLinkBlock,
  StyledReferralCopyLink,
  TierWrapper,
  StatsInfoSegment,
  StatsInfoRow,
  StatsTitleIconTooltipWrapper,
  StatsTitleIconWrapper,
  StatsGrayTextDesktop,
  StatsGrayTextMobile,
  StatsValueWrapper,
  ArrowSeparator,
  StatsWhiteText,
  MobileDivider,
  TierButtonWrapper,
  ClaimButton,
  RewardSecondaryTextWrapper,
  StyledClockIcon,
} from "./RewardReferral.styles";

import { ReactComponent as PurpleBanner } from "assets/bg-banners/purple-card-banner.svg";
import { ReferralsSummary } from "hooks/useReferralSummary";
import { Tooltip } from "components/Tooltip";
import { ExternalLink } from "components/ExternalLink";
import StepperWithTooltips from "../StepperWithTooltips";
import { useConnection } from "hooks";
import { formatEther, formatNumberMaxFracDigits, rewardTiers } from "utils";

import { ReactComponent as WalletIcon } from "assets/icons/wallet-24.svg";
import { ReactComponent as TransferIcon } from "assets/icons/transfer-24.svg";
import { ReactComponent as TransferUniqueIcon } from "assets/icons/transfer-1-24.svg";
import { ReactComponent as GraphIcon } from "assets/icons/graph-24.svg";
import { ReactComponent as IncreaseIcon } from "assets/icons/increase-24.svg";
import { ReactComponent as TrophyIcon } from "assets/icons/trophy-24.svg";
import { repeatableTernaryBuilder } from "utils/ternary";
import { Text } from "components/Text";
import { ClaimRewardsModal } from "../ClaimRewardsModal";
import { BigNumber } from "ethers";

interface Props {
  isConnected: boolean;
  referrer?: string;
  loading: boolean;
  referralsSummary: ReferralsSummary;
  unclaimedReferralRewardAmount?: BigNumber;
}

export const tiers: Record<
  number,
  { name: string; referralRate: number; referrals: number; volume: number }
> = {
  "1": { name: "Copper", referralRate: 0.4, referrals: 0, volume: 0 },
  "2": { name: "Bronze", referralRate: 0.5, referrals: 3, volume: 50000 },
  "3": { name: "Silver", referralRate: 0.6, referrals: 5, volume: 100000 },
  "4": { name: "Gold", referralRate: 0.7, referrals: 10, volume: 250000 },
  "5": { name: "Platinum", referralRate: 0.8, referrals: 20, volume: 500000 },
};

const RewardReferral: React.FC<Props> = ({
  isConnected,
  referrer,
  referralsSummary,
  loading,
  unclaimedReferralRewardAmount,
}) => {
  return (
    <Wrapper>
      <ReferralLinkComponent isConnected={isConnected} referrer={referrer} />
      <ReferralTierComponent
        isConnected={isConnected}
        referralsSummary={referralsSummary}
        unclaimedReferralRewardAmount={unclaimedReferralRewardAmount}
        loading={loading}
      />
    </Wrapper>
  );
};

const ReferralLinkComponent: React.FC<{
  isConnected: boolean;
  referrer: string | undefined;
}> = ({ isConnected }) => {
  const { connect } = useConnection();

  return (
    <ReferralLinkBlock>
      <ReferralLinkBlockBannerWrapper>
        <PurpleBanner />
      </ReferralLinkBlockBannerWrapper>
      <InnerReferralLinkBlock>
        <StyledReferralLogo />
        <Header>{isConnected ? "My referral link" : "Refer and earn"}</Header>
        <SubHeader>
          {isConnected
            ? "Share your unique referral link and collect ACX rewards for every transfer made from your referral."
            : "Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link."}
        </SubHeader>
        {!isConnected && (
          <ReferralLinkButtonsRow>
            <ConnectButton
              size="md"
              onClick={() => {
                connect({ trackSection: "referralTable" });
              }}
              data-cy="connect-wallet"
            >
              Connect to get started
            </ConnectButton>
            <ExternalLink
              href="https://docs.across.to/how-to-use-across/rewards/referral-rewards#how-to-earn-referral-rewards"
              text="Learn more"
            />
          </ReferralLinkButtonsRow>
        )}
      </InnerReferralLinkBlock>
      {isConnected && (
        <StyledReferralCopyLink>
          <CopyReferralLink condensed />
        </StyledReferralCopyLink>
      )}
    </ReferralLinkBlock>
  );
};

const ReferralTierComponent: React.FC<{
  referralsSummary: ReferralsSummary;
  isConnected: boolean;
  loading: boolean;
  unclaimedReferralRewardAmount?: BigNumber;
}> = ({
  loading,
  referralsSummary,
  isConnected,
  unclaimedReferralRewardAmount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rewardsAmount = useMemo(() => {
    if (referralsSummary.rewardsAmount) {
      return formatEther(referralsSummary.rewardsAmount);
    }
    return 0;
  }, [referralsSummary.rewardsAmount]);

  const nextTier = tiers[referralsSummary.tier + 1];

  const displayValuesTernary = repeatableTernaryBuilder(
    !loading && isConnected,
    <Text color="white-70">-</Text>
  );

  const nextTierTernary = repeatableTernaryBuilder<
    { arrow: boolean; Value: JSX.Element } | undefined
  >(!!nextTier, undefined);

  const datum = [
    {
      Icon: WalletIcon,
      title: { desktop: "Referee Wallets", mobile: "Wallets" },
      primaryText: String(referralsSummary.activeRefereesCount),
      tooltip: {
        title: "Referee wallets",
        description:
          "Number of unique wallets actively linked to your referral link.",
      },
    },
    {
      Icon: TransferUniqueIcon,
      title: {
        desktop: "Unique referral transfers",
        mobile: "Unique referral transfers",
      },
      primaryText: `${referralsSummary.referreeWallets} transfer${
        referralsSummary.referreeWallets !== 1 ? "s" : ""
      }`,
      secondaryText: nextTierTernary({
        arrow: true,
        Value: (
          <StatsGrayTextDesktop size="md">
            {nextTier?.referrals - referralsSummary.referreeWallets} to next
            tier
          </StatsGrayTextDesktop>
        ),
      }),
      tooltip: {
        title: "Unique referral transfers",
        description:
          "Total number of unique wallets that used your referral link.",
      },
    },
    {
      Icon: TransferIcon,
      title: { desktop: "Transfers", mobile: "Transfers" },
      primaryText: `${referralsSummary.transfers} transfer${
        referralsSummary.transfers !== 1 ? "s" : ""
      }`,
    },
    {
      Icon: GraphIcon,
      title: { desktop: "Volume from Transfers", mobile: "Volume" },
      primaryText: `$${formatNumberMaxFracDigits(referralsSummary.volume)}`,
      secondaryText: nextTierTernary({
        arrow: true,
        Value: (
          <StatsGrayTextDesktop size="md">
            $
            {formatNumberMaxFracDigits(
              nextTier?.volume - referralsSummary.volume
            )}{" "}
            to next tier
          </StatsGrayTextDesktop>
        ),
      }),
    },
    {
      Icon: IncreaseIcon,
      title: { desktop: "Referral Rate", mobile: "Rate" },
      primaryText: `${Math.floor(
        referralsSummary.referralRate * 0.75 * 100
      )}% referral rate`,
      secondaryText: nextTierTernary({
        arrow: false,
        Value: (
          <StatsGrayTextDesktop size="md">
            {Math.floor(referralsSummary.referralRate * 0.25 * 100)}% for
            referee
          </StatsGrayTextDesktop>
        ),
      }),
    },
    {
      Icon: TrophyIcon,
      title: { desktop: "Total Rewards", mobile: "Rewards" },
      secondaryText: unclaimedReferralRewardAmount
        ? {
            arrow: false,
            Value: (
              <RewardSecondaryTextWrapper>
                <Tooltip
                  title="Referral reward claiming"
                  body="New referral rewards are claimable 2 weeks after the first day of every month."
                  placement="bottom-start"
                  icon="clock"
                >
                  <StyledClockIcon />
                </Tooltip>
                <Text color="white-70">
                  {formatEther(unclaimedReferralRewardAmount)} ACX
                </Text>
                <StatsGrayTextDesktop size="md">claimable</StatsGrayTextDesktop>
              </RewardSecondaryTextWrapper>
            ),
          }
        : undefined,
      primaryText: `${rewardsAmount} ACX`,
    },
  ];

  return (
    <ReferralTierBlock>
      <ClaimRewardsModal
        isOpen={isModalOpen}
        onExit={() => setIsModalOpen(false)}
      />
      <TierButtonWrapper>
        <TierWrapper>
          <TierHeader>{tiers[referralsSummary.tier].name}</TierHeader>
          <TierSmHeader>Current referral tier</TierSmHeader>
        </TierWrapper>
        {isConnected && (
          <ClaimButton
            size="md"
            borderColor="yellow"
            onClick={() => setIsModalOpen(true)}
            disabled={
              !unclaimedReferralRewardAmount ||
              unclaimedReferralRewardAmount.eq(0)
            }
          >
            Claim rewards
          </ClaimButton>
        )}
      </TierButtonWrapper>
      <StepperWithTooltips
        currentStep={referralsSummary.tier - 1}
        numSteps={5}
        tooltips={rewardTiers}
      />
      <MobileDivider />
      <StatsInfoSegment>
        {datum.map((stat, ind) => (
          <React.Fragment key={ind}>
            {ind !== 0 && <MobileDivider />}
            <StatsInfoRow key={stat.title.desktop}>
              <StatsTitleIconTooltipWrapper>
                <StatsTitleIconWrapper>
                  <stat.Icon />
                  <StatsGrayTextDesktop size="md">
                    {stat.title.desktop}
                  </StatsGrayTextDesktop>
                  <StatsGrayTextMobile size="md">
                    {stat.title.mobile}
                  </StatsGrayTextMobile>
                </StatsTitleIconWrapper>
                {stat.tooltip && (
                  <Tooltip
                    title={stat.tooltip.title}
                    body={stat.tooltip.description}
                    placement="bottom-start"
                  >
                    <InfoIcon />
                  </Tooltip>
                )}
              </StatsTitleIconTooltipWrapper>
              {displayValuesTernary(
                <StatsValueWrapper>
                  {stat.secondaryText && (
                    <>
                      {stat.secondaryText.Value}
                      {stat.secondaryText.arrow && (
                        <ArrowSeparator>
                          <StatsGrayTextDesktop size="md">
                            ←
                          </StatsGrayTextDesktop>
                        </ArrowSeparator>
                      )}
                    </>
                  )}
                  <StatsWhiteText size="md">{stat.primaryText}</StatsWhiteText>
                </StatsValueWrapper>
              )}
            </StatsInfoRow>
          </React.Fragment>
        ))}
      </StatsInfoSegment>
    </ReferralTierBlock>
  );
};

export default RewardReferral;
