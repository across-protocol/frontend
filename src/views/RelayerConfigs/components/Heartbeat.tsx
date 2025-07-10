import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { Heart } from "react-feather";
import { COLORS } from "utils";

const heartbeat = keyframes`
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
`;

const HeartContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ${heartbeat} 1.5s ease-in-out infinite;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: ${COLORS.red};
  }
`;
const StyledHeart = styled(Heart)`
  width: 48px;
  height: 48px;
  fill: currentColor;
  color: ${COLORS.red};
`;

interface HeartbeatProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function Heartbeat({
  size = 20,
  color = COLORS.aqua,
  className,
}: HeartbeatProps) {
  return (
    <HeartContainer className={className}>
      <StyledHeart size={size} style={{ color, width: size, height: size }} />
    </HeartContainer>
  );
}
