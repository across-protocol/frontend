import styled from "@emotion/styled";
import { ReactComponent as ArrowUpDown } from "assets/icons/arrow-up-down.svg";
import { COLORS } from "utils";

type QuickSwapPropTypes = {
  onQuickSwap: () => void;
  disabled?: boolean;
};

const QuickSwap = ({ onQuickSwap, disabled }: QuickSwapPropTypes) => (
  <IconWrapper disabled={disabled} onClick={() => !disabled && onQuickSwap()}>
    <QuickSwapIcon />
  </IconWrapper>
);

export default QuickSwap;

const IconWrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  height: 32px;
  width: 40px;

  border: 1px solid #4c4e57;
  border-radius: 32px;

  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  background-color: ${() => COLORS["black-700"]};

  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;

    & > svg * {
      stroke: #e0f3ff;
    }
  }
`;

const QuickSwapIcon = styled(ArrowUpDown)`
  height: 12px;
  width: 12px;
`;
