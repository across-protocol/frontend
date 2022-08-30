import { useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  Wrapper,
  Header,
  SubHeader,
  ReferralLinkButtonsRow,
  ReferralUrl,
  StyledReferralLogo,
  ReferralLinkBlock,
  ReferralTierBlock,
  TierSmHeader,
  TierHeader,
  TierInfo,
  TierInfoItem,
  LightGrayItemText,
  WarningInfoItem,
  ConnectButton,
  ExternalLink,
  CopyIconDesktop,
  CopyIconMobile,
  InfoIcon,
  CopyCheckmark,
  ExternalLinkIcon,
  ArrowSeparator,
  RewardsInfo,
} from "./RewardReferral.styles";

import { shortenAddress } from "utils";
import { ReferralsSummary } from "hooks/useReferralSummary";
import { PopperTooltip } from "../../../../components/Tooltip";
import StepperWithTooltips from "../StepperWithTooltips";
import { useConnection } from "state/hooks";

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
}> = ({ isConnected, referrer }) => {
  const { connect } = useConnection();
  const [showCheck, setShowCheck] = useState(false);
  const referralUrl = useMemo(() => {
    if (referrer) {
      return `https://across.to/?ref=${referrer}`;
    }
    return "";
  }, [referrer]);
  const displayedReferralUrl = useMemo(() => {
    if (referrer) {
      return `across.to?ref=${shortenAddress(referrer, "..", 3)}`;
    }
    return "";
  }, [referrer]);

  return (
    <ReferralLinkBlock>
      <StyledReferralLogo />
      <Header>{isConnected ? "My referral link" : "Refer and earn"}</Header>
      <SubHeader>
        {isConnected
          ? "Share your unique referral link and collect ACX rewards for every transfer made from your referral."
          : "Join the referral program and earn a portion of fees in ACX for transfers made from your unique referral link."}
      </SubHeader>
      {isConnected ? (
        <ReferralLinkButtonsRow data-cy="referral-links">
          <ReferralUrl
            onClick={() => {
              navigator.clipboard.writeText(referralUrl);
              setShowCheck(true);
              setTimeout(() => setShowCheck(false), 1500);
            }}
          >
            <span>{displayedReferralUrl}</span>
            {!showCheck ? (
              <>
                <CopyIconDesktop />
                <CopyIconMobile />
              </>
            ) : (
              <CopyCheckmark />
            )}
          </ReferralUrl>
        </ReferralLinkButtonsRow>
      ) : (
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
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more <ExternalLinkIcon />
          </ExternalLink>
        </ReferralLinkButtonsRow>
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
      return Number(
        ethers.utils.formatUnits(referralsSummary.rewardsAmount, 18)
      ).toFixed(4);
    }
    return 0;
  }, [referralsSummary.rewardsAmount]);

  return (
    <ReferralTierBlock>
      <TierSmHeader>Current referral tier</TierSmHeader>
      <TierHeader>{tiers[referralsSummary.tier].name}</TierHeader>
      <StepperWithTooltips
        currentStep={referralsSummary.tier - 1}
        numSteps={5}
        tooltips={[
          {
            title: "Copper tier",
            titleSecondary: "40% referral rate",
            body: "Starting tier with no requirements to join.",
          },
          {
            title: "Bronzer tier",
            titleSecondary: "50% referral rate",
            body: "Requires over $50,000 of bridge volume or 3 unique referral transfers.",
          },
          {
            title: "Silver tier",
            titleSecondary: "60% referral rate",
            body: "Requires over $100,000 of bridge volume or 5 unique referral transfers.",
          },
          {
            title: "Gold tier",
            titleSecondary: "70% referral rate",
            body: "Requires over $250,000 of bridge volume or 10 unique referral transfers.",
          },
          {
            title: "Platinum tier",
            titleSecondary: "80% referral rate",
            body: "Requires over $500,000 of bridge volume or 20 unique referral transfers.",
          },
        ]}
      />
      <TierInfo>
        <TierInfoItem>Referee wallets</TierInfoItem>
        <TierInfoItem>{referralsSummary.activeRefereesCount}</TierInfoItem>
        <TierInfoItem>
          Unique referral transfers
          <PopperTooltip
            title="Total referee wallets"
            body="Number of unique wallets that have used your referral link."
            placement="bottom-start"
          >
            <InfoIcon />
          </PopperTooltip>
        </TierInfoItem>
        <TierInfoItem>
          {referralsSummary.tier < 5 && (
            <>
              <LightGrayItemText>
                {`${
                  tiers[referralsSummary.tier + 1].referrals -
                  referralsSummary.referreeWallets
                } to next tier`}
              </LightGrayItemText>
              <ArrowSeparator>&rarr;</ArrowSeparator>
            </>
          )}
          {referralsSummary.referreeWallets}
        </TierInfoItem>
        <TierInfoItem>Transfers</TierInfoItem>
        <TierInfoItem>{`${referralsSummary.transfers}`}</TierInfoItem>
        <TierInfoItem>Volume from transfers</TierInfoItem>
        <TierInfoItem>
          {referralsSummary.tier < 5 && (
            <>
              <LightGrayItemText>
                {`${(
                  tiers[referralsSummary.tier + 1].volume -
                  referralsSummary.volume
                ).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })} to next tier`}
              </LightGrayItemText>
              <ArrowSeparator>&rarr;</ArrowSeparator>
            </>
          )}
          {referralsSummary.volume.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </TierInfoItem>
        <TierInfoItem>Referral rate</TierInfoItem>
        <TierInfoItem>
          <LightGrayItemText margin={8}>{`${
            referralsSummary.referralRate * 100 * 0.25
          }% for referee`}</LightGrayItemText>
          {`${referralsSummary.referralRate * 100 * 0.75}%`}
        </TierInfoItem>
        <TierInfoItem>Rewards from transfers</TierInfoItem>
        {isConnected ? (
          <>
            <WarningInfoItem>
              <RewardsInfo>
                Not claimable yet
                <PopperTooltip
                  title={"Not claimable"}
                  body={"The ACX token is not live yet."}
                  placement="bottom"
                >
                  <InfoIcon />
                </PopperTooltip>
              </RewardsInfo>
              {`~${rewardsAmount} ACX`}
            </WarningInfoItem>
          </>
        ) : (
          <TierInfoItem>-</TierInfoItem>
        )}
      </TierInfo>
    </ReferralTierBlock>
  );
};

export default RewardReferral;
