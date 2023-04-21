import { useEffect } from "react";

import { useQueue } from "hooks/useQueue";

export type TrackingRequest = () => Promise<void> | void;

export function useAmpliTracking(areInitialPropsSet: boolean) {
  const { addToQueue, queue, processNext } = useQueue<TrackingRequest>();

  useEffect(() => {
    if (queue.length > 0 && areInitialPropsSet) {
      processNext(async (nextRequest) => await nextRequest());
    }
  }, [queue, processNext, areInitialPropsSet]);

  return { addToQueue, queue };
}
