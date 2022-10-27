import styled from "@emotion/styled";
import RewardTable from "components/RewardTable";
import { StakingPool } from "hooks";
import { formatRow, headers } from "./GenericStakingPoolFormatter";

type GenericStakingPoolTableType = {
  poolData?: StakingPool[];
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
