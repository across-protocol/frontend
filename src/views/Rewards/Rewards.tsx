import { Wrapper } from "./Rewards.styles";
import { RewardBreakdown, RewardHero, RewardAllPoolsTable } from "./comp";
import createAllPoolTableJSX, {
  headers,
} from "./comp/RewardAllPoolsTable/createAllPoolTableJSX";

const Rewards = () => {
  const rows = createAllPoolTableJSX();

  return (
    <Wrapper>
      <RewardHero />
      <RewardBreakdown />
      <RewardAllPoolsTable title="All pools" headers={headers} rows={rows} />
    </Wrapper>
  );
};

export default Rewards;
