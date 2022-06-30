import { RewardTable, ConnectTableOverlay } from "../";
import { useConnection } from "state/hooks";
import createMyReferralsTableJSX, {
  headers,
} from "../RewardTable/createMyReferralsTableJSX";
import { Wrapper } from "./RewardTableWithOverlay.styles";
const RewardTableWithOverlay = () => {
  const { isConnected } = useConnection();

  const rows = createMyReferralsTableJSX(isConnected);
  return (
    <Wrapper>
      {!isConnected ? <ConnectTableOverlay /> : null}
      <RewardTable title="My referrals" rows={rows} headers={headers} />
    </Wrapper>
  );
};

export default RewardTableWithOverlay;
