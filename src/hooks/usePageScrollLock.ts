import { useCallback, useEffect } from "react";

export default function usePageScrollLock() {
  const unlockScroll = useCallback(() => {
    document.body.style.overflow = "unset";
  }, []);

  const lockScroll = useCallback(() => {
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    return () => unlockScroll();
  }, [unlockScroll]);

  return {
    lockScroll,
    unlockScroll,
  };
}
