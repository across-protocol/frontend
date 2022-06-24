import { Wrapper } from "./Rewards.styles";
import { RewardReferral, RewardTable } from "./comp";
import Footer from "components/Footer";
import createMyReferralsTableJSX, {
  headers,
} from "./comp/RewardTable/createMyReferralsTableJSX";

const Rewards = () => {
  const rows = createMyReferralsTableJSX();
  return (
    <Wrapper>
      <RewardReferral />
      <RewardTable title="My referrals" rows={rows} headers={headers} />
      <Footer />
    </Wrapper>
  );
};

export default Rewards;
