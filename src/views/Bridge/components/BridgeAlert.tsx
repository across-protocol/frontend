import styled from "@emotion/styled";
import { ReactComponent as II } from "assets/icons/info-16.svg";
import { Text } from "components";

const BridgeInputErrorAlert: React.FC = ({ children }) => (
  <ErrorWrapper>
    <ErrorIcon />
    <Text size="sm" color="error">
      {children}
    </Text>
  </ErrorWrapper>
);

export default BridgeInputErrorAlert;

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-end;
  padding: 0px;
  gap: 8px;

  width: 100%;
`;

const ErrorIcon = styled(II)`
  height: 16px;
  width: 16px;

  & path {
    stroke: #f96c6c !important;
  }
`;
