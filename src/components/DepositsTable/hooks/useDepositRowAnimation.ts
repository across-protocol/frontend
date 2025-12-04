import { useEffect, useRef, useState } from "react";
import { Deposit, DepositStatus } from "hooks/useDeposits";

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
  deposit: Deposit
): DepositRowAnimationResult {
  const previousStatusRef = useRef<DepositStatus | null>(null);
  const [statusJustChanged, setStatusJustChanged] = useState(false);

  useEffect(() => {
    const currentStatus = deposit.status;
    const previousStatus = previousStatusRef.current;

    if (previousStatus !== null && previousStatus !== currentStatus) {
      setStatusJustChanged(true);
      const timer = setTimeout(() => setStatusJustChanged(false), 1200);
      return () => clearTimeout(timer);
    }

    previousStatusRef.current = currentStatus;
  }, [deposit.status]);

  const rowAnimation: AnimationProps = {
    initial: { opacity: 0, scaleY: 0 },
    animate: { opacity: 1, scaleY: 1 },
    transition: {
      opacity: { duration: 0.5, ease: "easeOut" },
      scaleY: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
    layout: true,
  };

  const shouldShowOverlay =
    previousStatusRef.current === null || statusJustChanged;

  if (!shouldShowOverlay) {
    return { rowAnimation, overlayProps: null };
  }

  const overlayColor: "aqua" | "white" =
    deposit.status === "filled" ? "aqua" : "white";

  const overlayAnimation: AnimationProps = {
    initial: { opacity: 0.3 },
    animate: { opacity: 0 },
    exit: { opacity: 0 },
    transition: { duration: 1.2, ease: "easeOut" },
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
