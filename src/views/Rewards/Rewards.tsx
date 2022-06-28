import { Wrapper } from "./Rewards.styles";
import { RewardReferral, RewardTable } from "./comp";
import Footer from "components/Footer";
import createMyReferralsTableJSX, {
  headers,
} from "./comp/RewardTable/createMyReferralsTableJSX";
import { useConnection } from "state/hooks";
const Rewards = () => {
  const { isConnected } = useConnection();

  const rows = createMyReferralsTableJSX(isConnected);
  return (
    <Wrapper>
      <RewardReferral />
      <RewardTable title="My referrals" rows={rows} headers={headers} />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
