import { Wrapper } from "./Rewards.styles";
import {
  RewardBreakdown,
  RewardHero,
  RewardMyPoolsTable,
  RewardAllPoolsTable,
} from "./comp";
import createAllPoolsTableJSX, {
  headers as allPoolsHeaders,
} from "./comp/RewardMyPoolsTable/createMyPoolsTableJSX";

import createMyPoolsTableJSX, {
  headers as myPoolsHeaders,
} from "./comp/RewardMyPoolsTable/createMyPoolsTableJSX";
const Rewards = () => {
  const rowsAllPools = createAllPoolsTableJSX();
  const rowsMyPools = createMyPoolsTableJSX();
  return (
    <Wrapper>
      <RewardHero />
      <RewardBreakdown />
      <RewardMyPoolsTable
        title="My pools"
        headers={allPoolsHeaders}
        rows={rowsAllPools}
      />
      <RewardAllPoolsTable
        title="All pools"
        headers={myPoolsHeaders}
        rows={rowsMyPools}
      />
    </Wrapper>
  );
};

export default Rewards;
