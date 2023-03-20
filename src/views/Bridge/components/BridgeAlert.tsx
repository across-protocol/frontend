import styled from "@emotion/styled";
import { Alert } from "components";
import { Text } from "components/Text";

const BridgeAlert: React.FC = ({ children }) => (
  <Alert iconType="info" status="warn">
    <Wrapper>
      <Text color="white-100" size="md">
        {children}
      </Text>
    </Wrapper>
  </Alert>
);

export default BridgeAlert;

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
