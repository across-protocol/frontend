import styled from "@emotion/styled";
import RewardTable from "components/RewardTable";
import { BigNumberish, BigNumber } from "ethers";
import { formatRow, headers } from "./GenericStakingPoolFormatter";

export type GenericStakingPoolRowData = {
  tokenSymbol: string;
  tokenLogoURI: string;
  poolName: string;
  multiplier: BigNumber;
  usersMultiplierPercentage: number;

  rewardAPY: BigNumber;
  baseAPY: BigNumber;
  rewards: BigNumber;

  usersStakedLP: BigNumber;
  usersTotalLP: BigNumber;

  ageOfCapital: number;

  rewardFormatter: (wei: BigNumberish) => string;
  lpTokenFormatter: (wei: BigNumberish) => string;
};

type GenericStakingPoolTableType = {
  poolData?: GenericStakingPoolRowData[];
  isLoading?: boolean;
};

const GenericStakingPoolTable = ({
  poolData = [],
  isLoading,
}: GenericStakingPoolTableType) => {
  const rows = poolData.map((datum) => formatRow(datum));
  return (
    <Wrapper>
      <RewardTable
        emptyMessage="No pools"
        isLoading={isLoading}
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
