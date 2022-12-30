import styled from "@emotion/styled";
import { ReactComponent as ArrowUpDown } from "assets/icons/arrow-up-down-16.svg";

type QuickSwapPropTypes = {
  onQuickSwap: () => void;
};

const QuickSwap = ({ onQuickSwap }: QuickSwapPropTypes) => (
  <Wrapper>
    <Divider />
    <IconWrapper onClick={() => onQuickSwap()}>
      <ArrowUpDown />
    </IconWrapper>
    <Divider />
  </Wrapper>
);

export default QuickSwap;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 0px;

  height: 58px;
`;

const IconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px;
  gap: 0;

  height: 40px;
  width: 40px;

  border: 1px solid #4c4e57;
  border-radius: 32px;

  cursor: pointer;

  &:hover {
    color: #e0f3ff;
    border-color: #e0f3ff;

    & > svg * {
      stroke: #e0f3ff;
    }
  }
`;

const Divider = styled.div`
  height: 9px;
  width: 1px;
  background-color: #4c4e57;
`;
