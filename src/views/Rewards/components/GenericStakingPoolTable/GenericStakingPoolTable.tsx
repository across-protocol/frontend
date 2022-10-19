import styled from "@emotion/styled";
import RewardTable from "components/RewardTable";
import createAllPoolsTableJSX from "../PoolTable/createAllPoolsTableJSX";
import { headers } from "./formatter";

const GenericStakingPoolTable = () => {
  const rows = createAllPoolsTableJSX();
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
