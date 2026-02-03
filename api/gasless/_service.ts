import { assert } from "superstruct";
import { getLogger } from "../_utils";
import { getGaslessPubSubConfig } from "./_config";
import {
  GaslessDepositMessageSchema,
  type GaslessDepositMessage,
  type PendingGaslessDeposit,
  type GaslessPendingResponse,
} from "./_types";
import { getSubscriberClient } from "../_pubsub";

const logger = getLogger();

/** TODO: Replace with real deduplication logic. */
export function isDuplicateGaslessDeposit(
  _message: GaslessDepositMessage
): boolean {
  return false;
}

function decodeMessageData(
  data: Uint8Array | Buffer
): GaslessDepositMessage | null {
  try {
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const parsed = JSON.parse(raw.toString("utf8"));
    assert(parsed, GaslessDepositMessageSchema);
    return parsed as GaslessDepositMessage;
  } catch {
    return null;
  }
}

/** Pub/Sub message publish time. */
interface PublishTimestamp {
  seconds?: string | number | { toNumber(): number } | null;
  nanos?: number | null;
}

/** Returns true if the message is still within TTL (not expired). */
function isWithinTtl(
  publishTime: PublishTimestamp | null | undefined,
  ttlSeconds: number
): boolean {
  if (!publishTime || publishTime.seconds == null) return false;
  const seconds = Number(publishTime.seconds);
  const nanos = publishTime.nanos ?? 0;
  const publishSeconds = seconds + nanos / 1e9;
  const nowSeconds = Date.now() / 1000;
  return nowSeconds - publishSeconds <= ttlSeconds;
}

export async function fetchPendingGaslessDeposits(): Promise<GaslessPendingResponse> {
  const config = getGaslessPubSubConfig();
  const subClient = getSubscriberClient();
  const subscriptionPath = subClient.subscriptionPath(
    config.projectId,
    config.subscriptionName
  );

  const ackIds: string[] = [];
  const nackIds: string[] = [];
  const deposits: PendingGaslessDeposit[] = [];

  try {
    const [response] = await subClient.pull({
      subscription: subscriptionPath,
      maxMessages: config.maxMessagesPerPull,
    });

    const receivedMessages = response.receivedMessages ?? [];

    for (const rm of receivedMessages) {
      const ackId = rm.ackId;
      const message = rm.message;
      if (!ackId || !message) {
        logger.warn({
          at: "gasless/_service",
          message: "Received message missing ackId or message body",
        });
        continue;
      }

      try {
        const data = message.data;
        const decoded = data ? decodeMessageData(data as Uint8Array) : null;

        if (!decoded) {
          logger.debug({
            at: "gasless/_service",
            message: "Invalid or unparseable message body, acking to remove",
          });
          ackIds.push(ackId);
          continue;
        }

        if (!isWithinTtl(message.publishTime, config.messageTtlSeconds)) {
          logger.debug({
            at: "gasless/_service",
            message: "Message TTL expired, acking to remove",
            depositId: decoded.swapTx?.data?.depositId,
          });
          ackIds.push(ackId);
          continue;
        }

        if (isDuplicateGaslessDeposit(decoded)) {
          logger.debug({
            at: "gasless/_service",
            message: "Duplicate gasless deposit, acking to remove",
            depositId: decoded.swapTx?.data?.depositId,
          });
          ackIds.push(ackId);
          continue;
        }

        deposits.push({
          ...decoded,
          messageId: message.messageId?.toString(),
        });
        ackIds.push(ackId);
      } catch (error) {
        logger.error({
          at: "gasless/_service",
          message: "Unexpected error processing message, nacking",
          error,
          ackId,
        });
        nackIds.push(ackId);
      }
    }

    if (ackIds.length > 0) {
      await subClient.acknowledge({
        subscription: subscriptionPath,
        ackIds,
      });
    }

    for (const id of nackIds) {
      try {
        await subClient.modifyAckDeadline({
          subscription: subscriptionPath,
          ackIds: [id],
          ackDeadlineSeconds: 0,
        });
      } catch (nackError) {
        logger.error({
          at: "gasless/_service",
          message: "Failed to nack message",
          ackId: id,
          error: nackError,
        });
      }
    }
  } finally {
    subClient.close();
  }

  return { deposits };
}
