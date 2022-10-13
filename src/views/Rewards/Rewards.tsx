import BreadcrumbV2 from "components/BreadcrumbV2";
import ConnectedReferralBox from "./components/ConnectedReferralBox";
import DisconnectedReferralBox from "./components/DisconnectedReferralBox";
import SectionWrapper from "./components/SectionWrapper";
import { useRewards } from "./hooks/useRewards";
import { Wrapper } from "./Rewards.style";

const Rewards = () => {
  const { isConnected, connectHandler, address } = useRewards();
  return (
    <Wrapper>
      <BreadcrumbV2 />
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
    </Wrapper>
  );
};

export default Rewards;
