import { BigNumber } from "ethers";
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
  const rows = poolData.flatMap((data) => {
    // Hide Balancer 50wstETH-50ACX pool if user has no LP tokens staked
    // TODO: Remove this once Balancer V2 hack is fixed
    if (
      data.isExternalLP &&
      data.tokenSymbol.toLowerCase() === "50wsteth-50acx" &&
      BigNumber.from(data.userAmountOfLPStaked).eq(0)
    ) {
      return [];
    }
    return formatRow(data, greyscaleTokenLogo);
  });
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
