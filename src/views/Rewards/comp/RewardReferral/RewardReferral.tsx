import { Stepper } from "components";
import {
  Wrapper,
  Header,
  SubHeader,
  CopyRow,
  ReferralUrl,
  CopyButton,
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
} from "./RewardReferral.styles";

import { onboard } from "utils";

const { init } = onboard;

const referralUrl = "across.to/referrer=0xa1..a234";
const referralText = "Across blurb www.across.to/referrer=0x....";
interface Props {
  isConnected: boolean;
}
const RewardReferral: React.FC<Props> = ({ isConnected }) => {
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
                <span>{referralUrl}</span>{" "}
                <CopyButton
                  onClick={() => {
                    navigator.clipboard.writeText(referralText);
                  }}
                >
                  Copy
                </CopyButton>
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
          <TierHeader>Bronze</TierHeader>
          <Stepper currentStep={2} numSteps={5} />
          <TierInfo>
            <TierInfoItem>Referee wallets</TierInfoItem>
            <TierInfoItem>3</TierInfoItem>
            <TierInfoItem>Transfers</TierInfoItem>
            <TierInfoItem>
              5 Transfers <LightGrayItemText>5 to next tier </LightGrayItemText>
            </TierInfoItem>
            <TierInfoItem>Volume transfers</TierInfoItem>
            <TierInfoItem>
              $54,321.24{" "}
              <LightGrayItemText>$25,000.00 to next tier</LightGrayItemText>
            </TierInfoItem>
            <TierInfoItem>Tier bonus</TierInfoItem>
            <TierInfoItem>
              <GreenItemText>50% referral fee</GreenItemText>
            </TierInfoItem>
            <TierInfoItem>Rewards from transfers</TierInfoItem>
            {isConnected ? (
              <WarningInfoItem>Not claimable yet ~2210.012 ACX</WarningInfoItem>
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
