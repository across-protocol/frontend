import { Deposit } from "hooks/useDeposits";

type AnimationProps = {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
  layout?: boolean;
};

type OverlayProps = {
  depositId: string;
  color: "aqua" | "white";
  animation: AnimationProps;
} | null;

type DepositRowAnimationResult = {
  rowAnimation: AnimationProps;
  overlayProps: OverlayProps;
};

export function useDepositRowAnimation(
  deposit: Deposit & { streamedAt?: number; updatedAt?: number }
): DepositRowAnimationResult {
  const isNewDeposit = !!deposit.streamedAt;
  const isUpdated = !!deposit.updatedAt;

  const rowAnimation: AnimationProps = isNewDeposit
    ? {
        initial: { opacity: 0, scaleY: 0 },
        animate: { opacity: 1, scaleY: 1 },
        transition: {
          opacity: { duration: 0.5, ease: "easeOut" },
          scaleY: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        },
        layout: true,
      }
    : { layout: true };

  const getOverlayColor = (): "aqua" | "white" | null => {
    if (!isNewDeposit && !isUpdated) return null;
    return deposit.status === "filled" ? "aqua" : "white";
  };

  const overlayColor = getOverlayColor();

  if (!overlayColor) {
    return { rowAnimation, overlayProps: null };
  }

  const overlayAnimation: AnimationProps = isNewDeposit
    ? {
        initial: { opacity: 0.3 },
        animate: { opacity: 0 },
        exit: { opacity: 0 },
        transition: { duration: 1.2, ease: "easeOut" },
      }
    : {
        initial: { opacity: 0.4 },
        animate: { opacity: 0 },
        exit: { opacity: 0 },
        transition: { duration: 1.0, ease: "easeOut" },
      };

  return {
    rowAnimation,
    overlayProps: {
      depositId: deposit.depositId,
      color: overlayColor,
      animation: overlayAnimation,
    },
  };
}
