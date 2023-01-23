/**
 * Create a function that takes a number of seconds and returns a string in the format of "XXh XXm XXs"
 * If the number of seconds is undefined, return undefined
 * @param seconds - number of seconds
 * @returns string in the format of "XXh XXm XXs" or undefined
 * @example formatSeconds(3600) // "01h 00m 00s"
 * @example formatSeconds(3661) // "01h 01m 01s"
 * @example formatSeconds(61) // "00h 01m 01s"
 * @example formatSeconds(1) // "00h 00m 01s"
 * @example formatSeconds(0) // "00h 00m 00s"
 * @example formatSeconds(undefined) // undefined
 **/
export function formatSeconds(seconds?: number): string | undefined {
  if (seconds === undefined) {
    return undefined;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsLeft = seconds % 60;

  return `${hours.toString().padStart(2, "0")}h ${minutes
    .toString()
    .padStart(2, "0")}m ${secondsLeft.toString().padStart(2, "0")}s`;
}

/**
 * Create a function that takes a number of milliseconds and returns a string in the format of "XXh XXm XX.XXs"
 * If the number of milliseconds is undefined, return undefined
 * @param milliseconds - number of milliseconds
 * @returns string in the format of "XXh XXm XX.XXs" or undefined
 * @example formatMilliseconds(3600000) // "01h 00m 00.000s"
 * @example formatMilliseconds(3661000) // "01h 01m 01.000s"
 * @example formatMilliseconds(61000) // "00h 01m 01.000s"
 * @example formatMilliseconds(1000) // "00h 00m 01.000s"
 * @example formatMilliseconds(0) // "00h 00m 00.000s"
 * @example formatMilliseconds(1) // "00h 00m 00.001s"
 * @example formatMilliseconds(undefined) // undefined
 **/
export function formatMilliseconds(milliseconds?: number): string | undefined {
  if (milliseconds === undefined) {
    return undefined;
  }

  const seconds = Math.floor(milliseconds / 1000);
  const millisecondsLeft = milliseconds % 1000;

  const previousSeconds = formatSeconds(seconds);
  if (previousSeconds === undefined) {
    return undefined;
  }

  return `${previousSeconds.slice(0, -1)}.${millisecondsLeft
    .toString()
    .padStart(3, "0")}s`;
}
