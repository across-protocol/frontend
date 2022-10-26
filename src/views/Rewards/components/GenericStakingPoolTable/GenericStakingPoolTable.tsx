import styled, { StyledComponent } from "@emotion/styled";
import RewardTable from "components/RewardTable";
import { BigNumberish } from "ethers";
import { formatRow, headers } from "./GenericStakingPoolFormatter";

export type GenericStakingPoolRowData = {
  logo: StyledComponent<any>;
  poolName: string;
  multiplier: number;

  rewardAPY: BigNumberish;
  baseAPY: BigNumberish;
  rewards: BigNumberish;
  maxAPY: BigNumberish;

  usersStakedLP: BigNumberish;
  usersTotalLP: BigNumberish;

  ageOfCapital: number;

  rewardFormatter: (wei: BigNumberish) => string;
  lpTokenFormatter: (wei: BigNumberish) => string;
};

type GenericStakingPoolTableType = {
  poolData?: GenericStakingPoolRowData[];
};

const GenericStakingPoolTable = ({
  poolData = [],
}: GenericStakingPoolTableType) => {
  const rows = poolData.map((datum) => formatRow(datum));
  return (
    <Wrapper>
      <RewardTable
        emptyMessage="Loading..."
        scrollable={true}
        rows={rows}
        headers={headers}
      />
    </Wrapper>
  );
};

export default GenericStakingPoolTable;

const Wrapper = styled.div`
  width: 100%;
`;
