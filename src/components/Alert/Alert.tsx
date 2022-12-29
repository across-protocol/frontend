import {
  ChildrenWrapper,
  StyledInfoIcon,
  StyledQuestionIcon,
  Wrapper,
} from "./Alert.styles";

export type AlertStatusType = "warn" | "danger" | "info";
export type AlertIconType = "info" | "question";

type AlertProps = {
  status: AlertStatusType;
  iconType?: AlertIconType;
};

const Alert: React.FC<AlertProps> = ({
  status,
  iconType: _iconType,
  children,
}) => {
  const iconType: AlertIconType = _iconType ?? "info";
  return (
    <Wrapper status={status}>
      {iconType === "info" ? (
        <StyledInfoIcon status={status} />
      ) : (
        <StyledQuestionIcon status={status} />
      )}
      <ChildrenWrapper> {children}</ChildrenWrapper>
    </Wrapper>
  );
};

export default Alert;
