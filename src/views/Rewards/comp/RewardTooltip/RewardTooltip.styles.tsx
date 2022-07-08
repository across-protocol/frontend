import styled from "@emotion/styled";
import { ReactComponent as UnstyledCheckmark } from "assets/checkmark.svg";

export const Wrapper = styled.div``;

export const TitleRow = styled.div`
  color: #e0f3ff;
  font-size: ${20 / 16}rem;
  svg {
    margin-right: 8px;
  }
`;

export const Body = styled.div`
  color: #c5d5e0;
  font-size: ${14 / 16}rem;
`;

export const ToolTips = styled.div`
  display: inline-block;
  svg {
    margin: 0;
    &:last-of-type {
      margin-left: -2px;
      margin-right: 8px;
    }
  }
`;

export const Checkmark = styled(UnstyledCheckmark)`
  border: 1px solid #4c4e57;

  height: 16px;
  width: 16px;
  border-radius: 8px;
  padding: 2px;
  path {
    stroke: #4c4e57;
  }
`;

export const GreenCheckmark = styled(Checkmark)`
  border-color: var(--color-primary);
  path {
    stroke: var(--color-primary);
  }
`;
