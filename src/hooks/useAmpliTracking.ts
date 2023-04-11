import { useEffect } from "react";

import { useQueue } from "hooks/useQueue";

type TrackingRequest = () => Promise<void>;

export function useAmpliTracking(areInitialPropsSet: boolean) {
  const { addToQueue, queue, processNext } = useQueue<TrackingRequest>();

  useEffect(() => {
    if (queue.length > 0 && areInitialPropsSet) {
      processNext(async (nextRequest) => await nextRequest());
    }
  }, [queue, processNext, areInitialPropsSet]);

  return { addToQueue, queue };
}
