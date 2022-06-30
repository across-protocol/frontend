import { RewardTable, ConnectTableOverlay } from "../";
import { useConnection } from "state/hooks";
import createMyReferralsTableJSX, {
  headers,
} from "../RewardTable/createMyReferralsTableJSX";

const RewardTableWithOverlay = () => {
  const { isConnected } = useConnection();

  const rows = createMyReferralsTableJSX(isConnected);
  return (
    <div>
      {!isConnected ? <ConnectTableOverlay /> : null}
      <RewardTable title="My referrals" rows={rows} headers={headers} />
    </div>
  );
};

export default RewardTableWithOverlay;
