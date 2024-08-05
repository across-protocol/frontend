import {
  ChildrenWrapper,
  StyledInfoIcon,
  StyledQuestionIcon,
  Wrapper,
} from "./Alert.styles";

export type AlertStatusType = "base" | "warn" | "danger" | "info";
export type AlertIconType = "info" | "question";

type AlertProps = {
  status: AlertStatusType;
  iconType?: AlertIconType;
  alignIcon?: "top" | "center";
  children: React.ReactNode;
};

const Alert: React.FC<AlertProps> = ({
  status,
  iconType: _iconType,
  alignIcon = "top",
  children,
}) => {
  const iconType: AlertIconType = _iconType ?? "info";
  return (
    <Wrapper status={status} align={alignIcon}>
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
