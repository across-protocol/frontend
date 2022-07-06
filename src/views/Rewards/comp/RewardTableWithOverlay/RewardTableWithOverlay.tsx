import { RewardTable, ConnectTableOverlay } from "../";
import createMyReferralsTableJSX, {
  headers,
} from "../RewardTable/createMyReferralsTableJSX";
import { Wrapper } from "./RewardTableWithOverlay.styles";
import { Referral } from "hooks/useReferrals";

const RewardTableWithOverlay: React.FC<{
  isConnected: boolean;
  referrals: Referral[];
  account: string;
}> = ({ isConnected, referrals, account }) => {
  const rows = createMyReferralsTableJSX(referrals, isConnected, account);

  return (
    <Wrapper>
      {!isConnected ? <ConnectTableOverlay /> : null}
      <RewardTable title="My referrals" rows={rows} headers={headers} />
    </Wrapper>
  );
};

export default RewardTableWithOverlay;
