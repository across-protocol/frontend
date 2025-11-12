import { useEffect, useRef, useState } from "react";

type UseLiveModeParams = {
  refetchFn: () => Promise<any>;
  refetchInterval: number;
  enabled: boolean;
  isLoading: boolean;
  onReset?: () => void;
};

type UseLiveModeResult = {
  isLiveMode: boolean;
  setIsLiveMode: (value: boolean) => void;
  isEnabled: boolean;
};

export function useLiveMode({
  refetchFn,
  refetchInterval,
  enabled,
  isLoading,
  onReset,
}: UseLiveModeParams): UseLiveModeResult {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const isRefetchingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setIsLiveMode(false);
    }
  }, [enabled]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (isVisible && isLiveMode && enabled && !isLoading) {
        onReset?.();
        await refetchFn();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLiveMode, enabled, isLoading, refetchFn, onReset]);

  useEffect(() => {
    const shouldRefetch = isLiveMode && enabled && isPageVisible && !isLoading;

    if (!shouldRefetch) {
      isRefetchingRef.current = false;
      return;
    }

    isRefetchingRef.current = true;

    const intervalId = setInterval(() => {
      void refetchFn();
    }, refetchInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    isLiveMode,
    enabled,
    isPageVisible,
    isLoading,
    refetchFn,
    refetchInterval,
  ]);

  return {
    isLiveMode,
    setIsLiveMode,
    isEnabled: enabled,
  };
}
