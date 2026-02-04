import { getGcpProjectId, getGcpCredentials, GcpCredentials } from "../_pubsub";
import { buildInternalCacheKey } from "../_cache";

const MESSAGE_TTL_SECONDS = 300;
const MAX_MESSAGES_PER_PULL = 100;

export interface GaslessPubSubConfig {
  projectId: string;
  subscriptionName: string;
  topicName: string;
  dltTopicName: string;
  messageTtlSeconds: number;
  maxMessagesPerPull: number;
  credentials?: GcpCredentials;
}

export function getGaslessPubSubConfig(): GaslessPubSubConfig {
  const projectId = getGcpProjectId();
  const subscriptionName = process.env.GASLESS_SUBSCRIPTION_NAME;
  const topicName =
    process.env.GASLESS_DEPOSITS_TOPIC || "topic-gasless-deposits";
  const dltTopicName =
    process.env.GASLESS_DLT_TOPIC || "topic-gasless-deposits-dlt";

  if (!subscriptionName) {
    throw new Error("GASLESS_SUBSCRIPTION_NAME must be set for gasless API");
  }

  return {
    projectId,
    subscriptionName,
    topicName,
    dltTopicName,
    messageTtlSeconds: MESSAGE_TTL_SECONDS,
    maxMessagesPerPull: MAX_MESSAGES_PER_PULL,
    credentials: getGcpCredentials(),
  };
}

// Redis key helpers for gasless deposits
export const GASLESS_REDIS_KEYS = {
  /** Set containing all pending deposit IDs */
  pendingSet: () => buildInternalCacheKey("gasless", "pending"),
  /** Individual deposit data key */
  deposit: (depositId: string) =>
    buildInternalCacheKey("gasless", "deposit", depositId),
};

export const GASLESS_DEPOSIT_TTL_SECONDS = MESSAGE_TTL_SECONDS;

/** Shared secret for authenticating Pub/Sub push requests */
export function getGaslessPushSecret(): string | undefined {
  return process.env.GASLESS_PUSH_SECRET;
}
