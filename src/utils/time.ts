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
