import styled from "@emotion/styled";
import { Alert } from "components";
import { Text } from "components/Text";

const SlippageAlert = () => (
  <Alert iconType="question" status="info">
    <Wrapper>
      <Text color="white-100" size="md">
        All transfers are slippage free.
      </Text>
      <Link color="teal" size="md">
        Learn more
      </Link>
    </Wrapper>
  </Alert>
);

export default SlippageAlert;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;

  width: 100%;
`;

const Link = styled(Text)`
  cursor: pointer;
`;
