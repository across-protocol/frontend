import { useEffect, useState, useRef } from "react";

type UseLiveModeParams = {
  refetchFn: () => Promise<any>;
  refetchInterval: number;
  enabled: boolean;
  isLoading: boolean;
  isFetching?: boolean;
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
  isFetching,
  onReset,
}: UseLiveModeParams): UseLiveModeResult {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

  const refetchFnRef = useRef(refetchFn);
  const onResetRef = useRef(onReset);

  useEffect(() => {
    refetchFnRef.current = refetchFn;
    onResetRef.current = onReset;
  });

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
        onResetRef.current?.();
        await refetchFnRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isLiveMode, enabled, isLoading]);

  useEffect(() => {
    const shouldRefetch = isLiveMode && enabled && isPageVisible && !isLoading;

    if (!shouldRefetch) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!isFetching) {
        void refetchFnRef.current();
      }
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [
    isLiveMode,
    enabled,
    isPageVisible,
    isLoading,
    isFetching,
    refetchInterval,
  ]);

  return {
    isLiveMode,
    setIsLiveMode,
    isEnabled: enabled,
  };
}
