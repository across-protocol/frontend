import styled from "@emotion/styled";
import { Tooltip } from "react-tooltip";
import { ReactComponent as RoundedCheckmark16 } from "assets/icons/checkmark-circle.svg";

export const StyledAnchor = styled.a<{ width?: string }>`
  line-height: 1em;
  height: 1em;
  width: ${({ width }) => width};
`;

export const StyledTooltip = styled(Tooltip)`
  z-index: 5;
  padding: 0;
  margin: 0;
  box-shadow: 0;
  border-radius: 50%;
`;

export const Wrapper = styled.div<{ maxWidth?: number }>`
  padding: 16px;
  max-width: ${({ maxWidth = 320 }) => maxWidth}px;
  background: #202024;
  border: 1px solid #34353b;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.32);
  border-radius: 10px;
  z-index: 5;

  @media (max-width: 428px) {
    padding: 12px;
  }
`;

export const TitleRow = styled.div`
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  font-size: ${16 / 16}rem;
  font-weight: 400;
  line-height: ${20 / 16}rem;
  color: #e0f3ff;

  svg {
    margin-right: 8px;
  }

  @media (max-width: 428) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const TitleSecondary = styled.span`
  margin-left: 12px;
  color: #9daab2;
`;

export const Body = styled.div`
  color: #c5d5e0;
  font-size: ${14 / 16}rem;
  font-weight: 400;
  line-height: ${18 / 16}rem;
  white-space: normal;

  @media (max-width: 428) {
    font-size: ${12 / 16}rem;
    line-height: ${16 / 16}rem;
  }
`;

export const GreyRoundedCheckmark16 = styled(RoundedCheckmark16)`
  path,
  rect {
    stroke: #4c4e57;
  }
`;
