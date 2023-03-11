import styled from "@emotion/styled";
import { Alert } from "components";
import { Text } from "components/Text";

const InsufficientLiquidityAlert = () => (
  <Alert iconType="info" status="warn">
    <Wrapper>
      <Text color="white-100" size="md">
        Insufficient bridge liquidity to process this transfer.
      </Text>
    </Wrapper>
  </Alert>
);

export default InsufficientLiquidityAlert;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px;
  padding-top: 1px;
  gap: 12px;

  width: 100%;
`;
