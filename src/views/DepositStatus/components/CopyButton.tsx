import { COLORS } from "utils";
import {
  SecondaryButton,
  SecondaryButtonProps,
} from "../../../components/Button/Button";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { useEffect, useState } from "react";

const ANIMATION_DURATION_MS = 100;
const ANIMATION_DELAY_MS = ANIMATION_DURATION_MS / 2;

export type CopyState = "ready" | "success" | "error";

export type CopyButtonProps = Omit<SecondaryButtonProps, "children"> & {
  className?: string;
  copyState: CopyState;
  onClick: () => void;
};

const stateLabels: Record<CopyState, string> = {
  ready: "COPY TO CLIPBOARD",
  success: "COPIED!",
  error: "COPY FAILED",
};

export function CopyButton({
  className,
  copyState,
  onClick,
  ...props
}: CopyButtonProps) {
  const [displayText, setDisplayText] = useState(stateLabels["ready"]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const newText = stateLabels[copyState];
    if (newText !== displayText) {
      setIsAnimating(true);
      // After the exit animation completes, update the text and trigger enter animation
      setTimeout(() => {
        setDisplayText(newText);
        setIsAnimating(false);
      }, ANIMATION_DELAY_MS); // Half of the total animation duration
    }
  }, [copyState, displayText]);

  return (
    <Button className={className} onClick={onClick} {...props}>
      <TextContainer>
        <AnimatedText $isExiting={isAnimating}>{displayText}</AnimatedText>
      </TextContainer>
    </Button>
  );
}

const slideDownBlur = keyframes`
  0% {
    transform: translateY(0);
    filter: blur(0px);
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    filter: blur(4px);
    opacity: 0;
  }
`;

const slideUpBlur = keyframes`
  0% {
    transform: translateY(-100%);
    filter: blur(4px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    filter: blur(0px);
    opacity: 1;
  }
`;

const Button = styled(SecondaryButton)`
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(108, 249, 216, 0.1);
  position: relative;
  overflow: hidden;
  min-width: 188px; /* Approximate width of ready state. Set this so the button doesn't shrink when we change label */

  &:hover:not(:disabled) {
    border-color: ${COLORS.aqua};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TextContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const AnimatedText = styled.span<{ $isExiting: boolean }>`
  white-space: nowrap;
  font-weight: 500;
  animation: ${({ $isExiting }) => ($isExiting ? slideDownBlur : slideUpBlur)}
    ${ANIMATION_DURATION_MS}ms ease-out;
  animation-fill-mode: both;
`;
