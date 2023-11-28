import styled from "@emotion/styled";
import RewardTable from "components/RewardTable";
import { StakingPool } from "utils/staking-pool";
import { formatRow, headers } from "./GenericStakingPoolFormatter";

type GenericStakingPoolTableType = {
  poolData?: StakingPool[];
  isLoading?: boolean;
  greyscaleTokenLogo?: boolean;
};

const GenericStakingPoolTable = ({
  poolData = [],
  isLoading,
  greyscaleTokenLogo = false,
}: GenericStakingPoolTableType) => {
  const rows = poolData.map((datum) => formatRow(datum, greyscaleTokenLogo));
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
