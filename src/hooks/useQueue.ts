import { useCallback, useState } from "react";

export function useQueue<T>() {
  const [queue, setQueue] = useState<T[]>([]);

  const addToQueue = useCallback((item: T) => {
    setQueue((prevQueue) => [...prevQueue, item]);
  }, []);

  const processNext = useCallback(
    async (processFn: (item: T) => Promise<any>) => {
      const [next, ...rest] = queue;

      if (!next) {
        return;
      }
      console.log("processNext", { next, rest });

      await processFn(next);
      setQueue(rest);
      return next;
    },
    [queue]
  );

  return {
    queue,
    addToQueue,
    processNext,
  };
}
