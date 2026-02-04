import { assert } from "superstruct";
import { GaslessDepositMessage, GaslessDepositMessageSchema } from "./_types";

/** Pub/Sub message publish time. */
interface PublishTimestamp {
  seconds?: string | number | { toNumber(): number } | null;
  nanos?: number | null;
}

/**
 * Check if a message is still within TTL (not expired).
 * @param publishTime - The publish time of the message.
 * @param ttlSeconds - The TTL in seconds.
 * @returns True if the message is still within TTL, false otherwise.
 */
export function isWithinTtl(
  publishTime: PublishTimestamp | string | null | undefined,
  ttlSeconds: number
): boolean {
  let publishTimestampSecs = 0;
  if (typeof publishTime === "string") {
    const date = new Date(publishTime);
    publishTimestampSecs = Math.floor(date.getTime() / 1000);
  } else if (publishTime && "seconds" in publishTime) {
    publishTimestampSecs = Number(publishTime.seconds);
  } else {
    return false;
  }
  const nowSeconds = Date.now() / 1000;
  return nowSeconds - publishTimestampSecs <= ttlSeconds;
}

/**
 * Decode a base64-encoded message data into a GaslessDepositMessage.
 * @param base64Data - The base64-encoded message data.
 * @returns The decoded GaslessDepositMessage, or null if decoding fails.
 */
export function decodeBase64MessageData(
  base64Data: string
): GaslessDepositMessage | null {
  try {
    const decoded = Buffer.from(base64Data, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    assert(parsed, GaslessDepositMessageSchema);
    return parsed as GaslessDepositMessage;
  } catch {
    return null;
  }
}
