import { ChildrenWrapper, StyledInfoIcon, Wrapper } from "./Alert.styles";

export type AlertStatusType = "warn";

type AlertProps = {
  status: AlertStatusType;
};

const Alert: React.FC<AlertProps> = ({ status, children }) => (
  <Wrapper status={status}>
    <StyledInfoIcon status={status} />
    <ChildrenWrapper> {children}</ChildrenWrapper>
  </Wrapper>
);

export default Alert;
