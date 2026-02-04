import { assert } from "superstruct";
import { getLogger } from "../_utils";
import { getGaslessPubSubConfig, GASLESS_REDIS_KEYS } from "./_config";
import {
  GaslessDepositMessageSchema,
  type GaslessDepositMessage,
  type PendingGaslessDeposit,
} from "./_types";
import { getSubscriberClient } from "../_pubsub";
import { redisCache } from "../_cache";
import { isWithinTtl } from "./_utils";

export type FetchPendingGaslessDepositsResult = {
  deposits: PendingGaslessDeposit[];
  cleanup: () => Promise<void>;
};

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

export async function fetchPendingGaslessDeposits(): Promise<FetchPendingGaslessDepositsResult> {
  const config = getGaslessPubSubConfig();
  const subClient = getSubscriberClient();
  const subscriptionPath = subClient.subscriptionPath(
    config.projectId,
    config.subscriptionName
  );

  const ackIds: string[] = [];
  const nackIds: string[] = [];
  const deposits: PendingGaslessDeposit[] = [];

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
          message: "Message TTL expired, nacking",
          depositId: decoded.swapTx?.data?.depositId,
        });
        nackIds.push(ackId);
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

  const cleanup = async () => {
    try {
      if (ackIds.length > 0) {
        await subClient.acknowledge({
          subscription: subscriptionPath,
          ackIds,
        });
      }
      if (nackIds.length > 0) {
        await subClient.modifyAckDeadline({
          subscription: subscriptionPath,
          ackIds: nackIds,
          ackDeadlineSeconds: 0,
        });
      }
    } catch (error) {
      logger.error({
        at: "gasless/_service",
        message: "Failed to cleanup messages",
        error,
        ackIds,
        nackIds,
      });
    }
  };

  return { deposits, cleanup };
}

/**
 * Fetch pending gasless deposits from Redis (push-based).
 * Uses SMEMBERS to get pending IDs, then MGET to batch-fetch deposit data.
 * Expired keys (TTL) are lazily cleaned from the pending set.
 */
export async function fetchPendingGaslessDepositsFromCache(): Promise<FetchPendingGaslessDepositsResult> {
  const pendingSetKey = GASLESS_REDIS_KEYS.pendingSet();

  // Get all pending deposit IDs
  const depositIds = await redisCache.smembers(pendingSetKey);

  if (depositIds.length === 0) {
    return { deposits: [], cleanup: async () => {} };
  }

  // Batch-fetch all deposit data
  const depositKeys = depositIds.map((id) => GASLESS_REDIS_KEYS.deposit(id));
  const depositDataList = await redisCache.mget<PendingGaslessDeposit>(
    ...depositKeys
  );

  const deposits: PendingGaslessDeposit[] = [];
  const expiredIds: string[] = [];

  for (let i = 0; i < depositIds.length; i++) {
    const depositData = depositDataList[i];
    if (depositData) {
      deposits.push(depositData);
    } else {
      // Key expired (TTL), mark for cleanup from set
      expiredIds.push(depositIds[i]);
    }
  }

  // Lazy cleanup: remove expired IDs from pending set
  const cleanup = async () => {
    if (expiredIds.length > 0) {
      try {
        await redisCache.srem(pendingSetKey, ...expiredIds);
        logger.debug({
          at: "gasless/_service",
          message: "Cleaned up expired deposit IDs from pending set",
          expiredCount: expiredIds.length,
        });
      } catch (error) {
        logger.error({
          at: "gasless/_service",
          message: "Failed to cleanup expired deposit IDs",
          error,
          expiredIds,
        });
      }
    }
  };

  return { deposits, cleanup };
}
