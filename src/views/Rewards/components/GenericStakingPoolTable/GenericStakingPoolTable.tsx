import styled, { StyledComponent } from "@emotion/styled";
import RewardTable from "components/RewardTable";
import { StyledETHIcon } from "components/RewardTable/RewardTables.styles";
import { BigNumberish } from "ethers";
import { formatRow, headers } from "./formatter";

export type GenericStakingPoolRowData = {
  logo: StyledComponent<any>;
  poolName: string;
  multiplier: number;

  rewardAPY: BigNumberish;
  baseAPY: BigNumberish;
  rewards: BigNumberish;

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
    rewardAPY: "2",
    baseAPY: "2",
    rewardFormatter: () => "4",
    lpTokenFormatter: () => "4",
    rewards: "3",
    ageOfCapital: 3,
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
