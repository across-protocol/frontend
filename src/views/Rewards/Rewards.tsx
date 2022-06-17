import { Wrapper } from "./Rewards.styles";
import { RewardBreakdown, RewardHero, RewardTable } from "./comp";
import createAllPoolsTableJSX, {
  headers as allPoolsHeaders,
} from "./comp/RewardTable/createMyPoolsTableJSX";

import createMyPoolsTableJSX, {
  headers as myPoolsHeaders,
} from "./comp/RewardTable/createAllPoolsTableJSX";
const Rewards = () => {
  const rowsAllPools = createAllPoolsTableJSX();
  const rowsMyPools = createMyPoolsTableJSX();
  return (
    <Wrapper>
      <RewardHero />
      <RewardBreakdown />
      <RewardTable
        title="My pools"
        headers={allPoolsHeaders}
        rows={rowsAllPools}
      />
      <RewardTable
        title="All pools"
        headers={myPoolsHeaders}
        rows={rowsMyPools}
      />
    </Wrapper>
  );
};

export default Rewards;
