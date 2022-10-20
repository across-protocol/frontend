import styled, { StyledComponent } from "@emotion/styled";
import RewardTable from "components/RewardTable";
import { StyledETHIcon } from "components/RewardTable/RewardTables.styles";
import { BigNumberish } from "ethers";
import { formatUnitsFnBuilder, parseUnits } from "utils";
import { formatRow, headers } from "./formatter";

export type GenericStakingPoolRowData = {
  logo: StyledComponent<any>;
  poolName: string;
  multiplier: number;

  rewardAPY: BigNumberish;
  baseAPY: BigNumberish;
  rewards: BigNumberish;

  usersStakedLP: BigNumberish;
  usersTotalLP: BigNumberish;

  ageOfCapital: number;

  rewardFormatter: (wei: BigNumberish) => string;
  lpTokenFormatter: (wei: BigNumberish) => string;
};

type GenericStakingPoolTableType = {
  poolData?: GenericStakingPoolRowData[];
};

const SAMPLE_DATA: GenericStakingPoolRowData[] = [
  {
    poolName: "ETH",
    logo: StyledETHIcon,
    multiplier: 2,
    rewardAPY: parseUnits(".0278", 18),
    baseAPY: parseUnits(".0139", 18),
    rewardFormatter: formatUnitsFnBuilder(18),
    lpTokenFormatter: formatUnitsFnBuilder(6),
    rewards: parseUnits("1", 18),
    ageOfCapital: 3,
    usersStakedLP: parseUnits("942021.23", 6),
    usersTotalLP: parseUnits("1242021.23", 6),
  },
  {
    poolName: "ETH",
    logo: StyledETHIcon,
    multiplier: 2,
    rewardAPY: parseUnits(".0278", 18),
    baseAPY: parseUnits(".0139", 18),
    rewardFormatter: formatUnitsFnBuilder(18),
    lpTokenFormatter: formatUnitsFnBuilder(6),
    rewards: parseUnits("1", 18),
    ageOfCapital: 3,
    usersStakedLP: parseUnits("942021.23", 6),
    usersTotalLP: parseUnits("1242021.23", 6),
  },
];

const GenericStakingPoolTable = ({
  poolData = SAMPLE_DATA,
}: GenericStakingPoolTableType) => {
  const rows = poolData.map((datum) => formatRow(datum));
  return (
    <Wrapper>
      <RewardTable scrollable={true} rows={rows} headers={headers} />
    </Wrapper>
  );
};

export default GenericStakingPoolTable;

const Wrapper = styled.div`
  width: 100%;
`;
