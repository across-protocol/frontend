import BreadcrumbV2 from "components/BreadcrumbV2";
import ConnectedReferralBox from "./components/ConnectedReferralBox";
import DisconnectedReferralBox from "./components/DisconnectedReferralBox";
import OverviewRewardSection from "./components/OverviewRewardSection";
import SectionWrapper from "../../components/SectionTitleWrapperV2/SectionWrapperV2";
import { useRewards } from "./hooks/useRewards";
import { InnerSectionWrapper, Wrapper } from "./Rewards.style";
import GenericStakingPoolTable from "./components/GenericStakingPoolTable/GenericStakingPoolTable";

const Rewards = () => {
  const {
    isConnected,
    connectHandler,
    address,
    totalRewards,
    stakedTokens,

    referralTier,
    referralRate,
    referralRewards,
    referralTransfers,
    referralVolume,
    referralWallets,

    formatterFn,
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
            <ConnectedReferralBox
              walletCount={referralWallets}
              transferCount={referralTransfers}
              volume={referralVolume}
              formatter={formatterFn}
              referralRate={referralRate}
              rewards={referralRewards}
            />
          ) : (
            <DisconnectedReferralBox connectHandler={connectHandler} />
          )}
        </SectionWrapper>
        <SectionWrapper title="All pools">
          <GenericStakingPoolTable />
        </SectionWrapper>
      </InnerSectionWrapper>
    </Wrapper>
  );
};

export default Rewards;
