import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import { COLORS } from "utils";

type AnimationProps = {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
};

type OverlayConfig = {
  depositId: string;
  color: "aqua" | "white";
  animation: AnimationProps;
};

type Props = {
  overlay: OverlayConfig | null;
};

export function AnimatedColorOverlay({ overlay }: Props) {
  const props = overlay;
  if (!props) return null;

  const { depositId, color, animation } = props;

  return (
    <AnimatePresence>
      <ColorOverlay
        key={`overlay-${depositId}`}
        className="color-overlay"
        color={color}
        {...animation}
      />
    </AnimatePresence>
  );
}

const ColorOverlay = styled(motion.div)<{ color: "aqua" | "yellow" | "white" }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ color }) => COLORS[color]};
  pointer-events: none;
  z-index: 0;
`;
