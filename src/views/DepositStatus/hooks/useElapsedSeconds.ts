import { useState, useEffect } from "react";

import { formatSeconds } from "utils";

export function useElapsedSeconds(
  startDateTimestampInSeconds?: number,
  endDateTimestampInSeconds?: number
) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number | undefined>();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startDateTimestampInSeconds && endDateTimestampInSeconds) {
      setElapsedSeconds(
        Math.max(endDateTimestampInSeconds - startDateTimestampInSeconds, 0)
      );
    } else if (startDateTimestampInSeconds) {
      interval = setInterval(() => {
        setElapsedSeconds(
          Math.max(new Date().getTime() / 1000 - startDateTimestampInSeconds, 0)
        );
      }, 1000);
    } else {
      setElapsedSeconds(undefined);
    }
    return () => clearInterval(interval);
  }, [startDateTimestampInSeconds, endDateTimestampInSeconds]);

  const elapsedTimeAsFormattedString = formatSeconds(
    Math.floor(elapsedSeconds || 0)
  );

  return {
    elapsedSeconds,
    elapsedTimeAsFormattedString,
  };
}
