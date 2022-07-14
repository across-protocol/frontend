import styled from "@emotion/styled";
import { ReactComponent as RoundedCheckmark16 } from "assets/icons/rounded-checkmark-16.svg";

export const Wrapper = styled.div`
  padding: 16px;
  max-width: 320px;
  background: #202024;
  border: 1px solid #34353b;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.32);
  border-radius: 10px;
  z-index: 5;
`;

export const TitleRow = styled.div`
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  color: #e0f3ff;

  svg {
    margin-right: 8px;
  }
`;

export const Body = styled.div`
  color: #c5d5e0;
  font-size: ${14 / 16}rem;
  line-height: ${18 / 16}rem;
  white-space: normal;
`;

export const GreyRoundedCheckmark16 = styled(RoundedCheckmark16)`
  path,
  rect {
    stroke: #4c4e57;
  }
`;
