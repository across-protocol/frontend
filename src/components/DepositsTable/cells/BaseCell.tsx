import styled from "@emotion/styled";

export const BaseCell = styled.td<{ width: number }>`
  padding: 16px 0px;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: ${({ width }) => width}px;
`;
