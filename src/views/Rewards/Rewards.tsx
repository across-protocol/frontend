import BreadcrumbV2 from "components/BreadcrumbV2";
import ConnectedReferralBox from "./components/ConnectedReferralBox";
import DisconnectedReferralBox from "./components/DisconnectedReferralBox";
import OverviewRewardSection from "./components/OverviewRewardSection";
import SectionWrapper from "./components/SectionWrapper";
import { useRewards } from "./hooks/useRewards";
import { InnerSectionWrapper, Wrapper } from "./Rewards.style";

const Rewards = () => {
  const {
    isConnected,
    connectHandler,
    address,
    totalRewards,
    stakedTokens,
    referralTier,
  } = useRewards();
  return (
    <Wrapper>
      <BreadcrumbV2 />
      <InnerSectionWrapper>
        <SectionWrapper title="Overview">
          <OverviewRewardSection
            totalRewards={totalRewards}
            stakedTokens={stakedTokens}
            referralTier={referralTier}
          />
        </SectionWrapper>
        <SectionWrapper
          title="Referrals"
          link={{ name: "View all data", href: "/rewards/referrals" }}
        >
          {isConnected && address ? (
            <ConnectedReferralBox address={address} />
          ) : (
            <DisconnectedReferralBox connectHandler={connectHandler} />
          )}
        </SectionWrapper>
      </InnerSectionWrapper>
    </Wrapper>
  );
};

export default Rewards;
