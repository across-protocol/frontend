import { Stepper } from "components";
import {
  Wrapper,
  Header,
  SubHeader,
  CopyRow,
  ReferralUrl,
  StyledReferralLogo,
  ReferralRow,
  ReferralLinkBlock,
  ReferralTierBlock,
  IconWrapper,
  TierSmHeader,
  TierHeader,
  TierInfo,
  TierInfoItem,
  LightGrayItemText,
  GreenItemText,
  WarningInfoItem,
  ConnectRow,
  ConnectButton,
  LearnMoreText,
  ArrowUpRight,
  CopyIcon,
} from "./RewardReferral.styles";

import { onboard, shortenAddress } from "utils";
import { useMemo } from "react";
import { ReferralsSummary } from "views/Rewards/useRewardsView";
import { ethers } from "ethers";

const { init } = onboard;

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
  const referralUrl = useMemo(() => {
    if (referrer) {
      return `across.to/referrer=${referrer}`;
    }
    return "";
  }, [referrer]);
  const displayedReferralUrl = useMemo(() => {
    if (referrer) {
      return `across.to/referrer=${shortenAddress(referrer, "...", 4)}`;
    }
    return "";
  }, [referrer]);

  return (
    <Wrapper>
      <ReferralRow>
        <ReferralLinkBlock>
          <IconWrapper>
            <StyledReferralLogo />
          </IconWrapper>
          <Header>{isConnected ? "My referral link" : "Refer and earn"}</Header>
          <SubHeader>
            {isConnected
              ? "Share your unique referral link and collect ACX rewards for every transfer made from your referral."
              : "Join the referral program, earn fee rewards and collect ACX for transfers made from your unique referral link."}
          </SubHeader>
          {isConnected ? (
            <CopyRow>
              <ReferralUrl>
                <span>{displayedReferralUrl}</span>{" "}
                <CopyIcon
                  onClick={() => {
                    navigator.clipboard.writeText(referralUrl);
                  }}
                />
              </ReferralUrl>
            </CopyRow>
          ) : (
            <ConnectRow>
              <ConnectButton onClick={() => init()}>
                Connect to get started
              </ConnectButton>
              <LearnMoreText>
                Learn more <ArrowUpRight />
              </LearnMoreText>
            </ConnectRow>
          )}
        </ReferralLinkBlock>
        <ReferralTierBlock>
          <TierSmHeader>Current referral tier</TierSmHeader>
          <TierHeader>{tiers[referralsSummary.tier].name}</TierHeader>
          <Stepper currentStep={referralsSummary.tier} numSteps={5} />
          <TierInfo>
            <TierInfoItem>Referee wallets</TierInfoItem>
            <TierInfoItem>{referralsSummary.referreeWallets}</TierInfoItem>
            <TierInfoItem>Transfers</TierInfoItem>
            <TierInfoItem>
              {`${referralsSummary.transfers} Transfers `}
              {referralsSummary.tier < 5 && (
                <LightGrayItemText>
                  &rarr;{" "}
                  {`${
                    tiers[referralsSummary.tier + 1].referrals -
                    referralsSummary.transfers
                  } to next tier`}
                </LightGrayItemText>
              )}
            </TierInfoItem>
            <TierInfoItem>Volume transfers</TierInfoItem>
            <TierInfoItem>
              {referralsSummary.volume.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
              {referralsSummary.tier < 5 && (
                <LightGrayItemText>
                  &rarr;{" "}
                  {`${(
                    tiers[referralsSummary.tier + 1].volume -
                    referralsSummary.volume
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })} to next tier`}
                </LightGrayItemText>
              )}
            </TierInfoItem>
            <TierInfoItem>Tier bonus</TierInfoItem>
            <TierInfoItem>
              <GreenItemText>{`${
                referralsSummary.referralRate * 100
              }% referral fee`}</GreenItemText>
            </TierInfoItem>
            <TierInfoItem>Rewards from transfers</TierInfoItem>
            {isConnected ? (
              <WarningInfoItem>{`Not claimable yet ~${
                referralsSummary.rewardsAmount
                  ? Number(
                      ethers.utils.formatUnits(
                        referralsSummary.rewardsAmount,
                        18
                      )
                    ).toFixed(4)
                  : 0
              }
                
              ACX`}</WarningInfoItem>
            ) : (
              <TierInfoItem>-</TierInfoItem>
            )}
          </TierInfo>
        </ReferralTierBlock>
      </ReferralRow>
    </Wrapper>
  );
};

export default RewardReferral;
