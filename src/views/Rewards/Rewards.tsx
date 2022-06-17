import { Wrapper } from "./Rewards.styles";
import { RewardBreakdown, RewardHero, RewardMyPoolsTable } from "./comp";
import createAllPoolsTableJSX, {
  headers,
} from "./comp/RewardMyPoolsTable/createMyPoolsTableJSX";

const Rewards = () => {
  const rows = createAllPoolsTableJSX();

  return (
    <Wrapper>
      <RewardHero />
      <RewardBreakdown />
      <RewardMyPoolsTable title="All pools" headers={headers} rows={rows} />
    </Wrapper>
  );
};

export default Rewards;
