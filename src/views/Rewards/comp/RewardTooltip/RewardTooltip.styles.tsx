import styled from "@emotion/styled";

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
