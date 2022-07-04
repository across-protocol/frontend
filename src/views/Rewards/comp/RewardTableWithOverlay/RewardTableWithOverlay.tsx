import { RewardTable, ConnectTableOverlay } from "../";
import createMyReferralsTableJSX, {
  headers,
} from "../RewardTable/createMyReferralsTableJSX";
import { Wrapper } from "./RewardTableWithOverlay.styles";
import { Referral } from "views/Rewards/useRewardsView";

const RewardTableWithOverlay: React.FC<{
  isConnected: boolean;
  referrals: Referral[];
}> = ({ isConnected, referrals }) => {
  const rows = createMyReferralsTableJSX(referrals, isConnected);

  return (
    <Wrapper>
      {!isConnected ? <ConnectTableOverlay /> : null}
      <RewardTable title="My referrals" rows={rows} headers={headers} />
    </Wrapper>
  );
};

export default RewardTableWithOverlay;
