import { DateTime } from "luxon";

export function getTimeAgoText(seconds: number): string {
  const now = DateTime.now();
  const depositTime = DateTime.fromSeconds(seconds);
  const diff = now.diff(depositTime, ["minutes", "seconds"]).toObject();

  const totalSeconds = Math.floor(diff.seconds || 0);
  const totalMinutes = Math.floor((diff.minutes || 0) + totalSeconds / 60);

  if (totalMinutes === 0) {
    return "just now";
  } else if (totalMinutes < 3) {
    return `${totalMinutes}m ago`;
  } else {
    // After 3 minutes, show the actual date/time
    return depositTime.toFormat("dd LLL, hh:mm a");
  }
}
