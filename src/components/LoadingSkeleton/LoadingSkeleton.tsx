import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

const shimmer = keyframes`
  to {
    background-position-x: 0%
  }
`;

export const LoadingSkeleton = styled.div<{
  width?: string;
  height?: string;
  borderRadius?: string;
}>`
  display: flex;
  height: ${({ height }) => height || "20px"};
  width: ${({ width }) => width || "100%"};
  border-radius: ${({ borderRadius }) => borderRadius || "24px"};
  background: linear-gradient(
    90deg,
    rgba(76, 78, 87, 0) 40%,
    #4c4e57 50%,
    rgba(76, 78, 87, 0) 60%
  );
  background-size: 300%;
  background-position-x: 100%;
  animation: ${shimmer} 1s infinite linear;
`;
