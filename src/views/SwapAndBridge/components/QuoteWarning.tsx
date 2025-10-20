import styled from "@emotion/styled";
import { COLORS } from "utils";
import { ReactComponent as WarningTriangle } from "assets/icons/warning_triangle.svg";

type QuoteWarningProps = {
  message: string | null;
};

export const QuoteWarning = ({ message }: QuoteWarningProps) => {
  if (!message) {
    return null;
  }

  return (
    <WarningContainer>
      <AlertIcon>
        <WarningTriangle width={20} height={20} />
      </AlertIcon>
      <WarningText>{message}</WarningText>
    </WarningContainer>
  );
};

const WarningContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: ${COLORS["black-700"]};
  border: 1px solid ${COLORS.warning};
  width: 100%;
`;

const AlertIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${COLORS.warning};
  margin-top: 2px;

  svg {
    color: inherit;
  }
`;

const WarningText = styled.p`
  color: ${COLORS["light-200"]};
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  margin: 0;
`;
