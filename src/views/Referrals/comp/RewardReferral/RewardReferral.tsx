import React, { useMemo } from "react";
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
} from "./RewardReferral.styles";

import { ReactComponent as PurpleBanner } from "assets/bg-banners/purple-card-banner.svg";
import { ReferralsSummary } from "hooks/useReferralSummary";
import { PopperTooltip } from "components/Tooltip";
import { ExternalLink } from "components/ExternalLink";
import StepperWithTooltips from "../StepperWithTooltips";
import { useConnection } from "hooks";
import { formatEther, formatNumberMaxFracDigits, rewardTiers } from "utils";

import { ReactComponent as WalletIcon } from "assets/icons/wallet-24.svg";
import { ReactComponent as TransferIcon } from "assets/icons/transfer-24.svg";
import { ReactComponent as GraphIcon } from "assets/icons/graph-24.svg";
import { ReactComponent as IncreaseIcon } from "assets/icons/increase-24.svg";
import { ReactComponent as TrophyIcon } from "assets/icons/trophy-24.svg";
import { repeatableTernaryBuilder } from "utils/ternary";
import { Text } from "components/Text";
interface Props {
  isConnected: boolean;
  referrer: string | undefined;
  loading: boolean;
  referralsSummary: ReferralsSummary;
}

const tiers: Record<
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
  loading,
  referrer,
  referralsSummary,
}) => {
  return (
    <Wrapper>
      <ReferralLinkComponent isConnected={isConnected} referrer={referrer} />
      <ReferralTierComponent
        isConnected={isConnected}
        referralsSummary={referralsSummary}
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
              onClick={() => connect()}
              data-cy="connect-wallet"
            >
              Connect to get started
            </ConnectButton>
            <ExternalLink
              href="https://docs.across.to/v2/how-to-use-across/referral-program"
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
}> = ({ referralsSummary, isConnected }) => {
  const rewardsAmount = useMemo(() => {
    if (referralsSummary.rewardsAmount) {
      return formatEther(referralsSummary.rewardsAmount);
    }
    return 0;
  }, [referralsSummary.rewardsAmount]);

  const nextTier = tiers[referralsSummary.tier + 1];

  const nextTierTernary = repeatableTernaryBuilder<
    { arrow: boolean; value: string | React.ReactHTMLElement<any> } | undefined
  >(!!nextTier, undefined);

  const datum = [
    {
      Icon: WalletIcon,
      title: { desktop: "Referee Wallets", mobile: "Wallets" },
      primaryText: String(referralsSummary.referreeWallets),
      tooltip: {
        title: "Referee wallets",
        description: "Lorem ipsum",
      },
    },
    {
      Icon: TransferIcon,
      title: { desktop: "Transfers", mobile: "Transfers" },
      primaryText: `${referralsSummary.transfers} transfer${
        referralsSummary.transfers !== 1 ? "s" : ""
      }`,
      secondaryText: nextTierTernary({
        arrow: true,
        value: `${
          nextTier.referrals - referralsSummary.referreeWallets
        } to next tier`,
      }),
      tooltip: {
        title: "Transfers",
        description: "Lorem ipsum",
      },
    },
    {
      Icon: GraphIcon,
      title: { desktop: "Volume from Transfers", mobile: "Volume" },
      primaryText: `$${formatNumberMaxFracDigits(referralsSummary.volume)}`,
      secondaryText: nextTierTernary({
        arrow: true,
        value: `$${formatNumberMaxFracDigits(
          nextTier.volume - referralsSummary.volume
        )} to next tier`,
      }),
      tooltip: {
        title: "Volume from Transfers",
        description: "Lorem ipsum",
      },
    },
    {
      Icon: IncreaseIcon,
      title: { desktop: "Referral Rate", mobile: "Rate" },
      primaryText: `${Math.floor(
        referralsSummary.referralRate * 0.75 * 100
      )}% referral rate`,
      secondaryText: nextTierTernary({
        arrow: false,
        value: `${Math.floor(
          referralsSummary.referralRate * 0.25 * 100
        )}% for referee`,
      }),
      tooltip: {
        title: "Referral Rate",
        description: "Lorem ipsum",
      },
    },
    {
      Icon: TrophyIcon,
      title: { desktop: "Total Rewards", mobile: "Rewards" },
      primaryText: `${rewardsAmount} ACX`,
      tooltip: {
        title: "Total Rewards",
        description: "Lorem ipsum",
      },
    },
  ];

  return (
    <ReferralTierBlock>
      <TierButtonWrapper>
        <TierWrapper>
          <TierHeader>{tiers[referralsSummary.tier].name}</TierHeader>
          <TierSmHeader>Current referral tier</TierSmHeader>
        </TierWrapper>
        {isConnected && (
          <ClaimButton size="lg">
            <Text>Claim rewards</Text>
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
                  <StatsGrayTextDesktop size="lg">
                    {stat.title.desktop}
                  </StatsGrayTextDesktop>
                  <StatsGrayTextMobile size="lg">
                    {stat.title.mobile}
                  </StatsGrayTextMobile>
                </StatsTitleIconWrapper>
                {stat.tooltip && (
                  <PopperTooltip
                    title={stat.tooltip.title}
                    body={stat.tooltip.description}
                    placement="bottom-start"
                  >
                    <InfoIcon />
                  </PopperTooltip>
                )}
              </StatsTitleIconTooltipWrapper>
              <StatsValueWrapper>
                {stat.secondaryText && (
                  <>
                    <StatsGrayTextDesktop size="lg">
                      {stat.secondaryText.value}
                    </StatsGrayTextDesktop>
                    {stat.secondaryText.arrow && (
                      <ArrowSeparator>
                        <StatsGrayTextDesktop size="lg">←</StatsGrayTextDesktop>
                      </ArrowSeparator>
                    )}
                  </>
                )}
                <StatsWhiteText size="lg">{stat.primaryText}</StatsWhiteText>
              </StatsValueWrapper>
            </StatsInfoRow>
          </React.Fragment>
        ))}
      </StatsInfoSegment>
    </ReferralTierBlock>
  );
};

export default RewardReferral;
