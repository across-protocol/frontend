import BreadcrumbV2 from "components/BreadcrumbV2";
import ConnectedReferralBox from "./components/ConnectedReferralBox";
import DisconnectedReferralBox from "./components/DisconnectedReferralBox";
import OverviewRewardSection from "./components/OverviewRewardSection";
import SectionWrapper from "../../components/SectionTitleWrapperV2/SectionWrapperV2";
import { useRewards } from "./hooks/useRewards";
import { InnerSectionWrapper, Wrapper } from "./Rewards.style";
import GenericStakingPoolTable from "./components/GenericStakingPoolTable/GenericStakingPoolTable";
import { LayoutV2 } from "components";
import useScrollElementByHashIntoView from "hooks/useScrollElementByHashIntoView";
import AdditionalQuestionCTA from "./components/AdditionalQuestionCTA";

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

    areStakingPoolsLoading,
    myPoolData,
    allPoolData,

    formatterFn,
  } = useRewards();

  useScrollElementByHashIntoView();

  return (
    <LayoutV2 maxWidth={1140}>
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
          {isConnected && (areStakingPoolsLoading || myPoolData.length > 0) && (
            <SectionWrapper title="My pools" id="my-pools">
              <GenericStakingPoolTable
                poolData={myPoolData}
                isLoading={areStakingPoolsLoading}
              />
            </SectionWrapper>
          )}

          {(areStakingPoolsLoading || allPoolData.length > 0) && (
            <SectionWrapper title="All pools">
              <GenericStakingPoolTable
                poolData={allPoolData}
                isLoading={areStakingPoolsLoading}
              />
            </SectionWrapper>
          )}

          <AdditionalQuestionCTA />
        </InnerSectionWrapper>
      </Wrapper>
    </LayoutV2>
  );
};

export default Rewards;
