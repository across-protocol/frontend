import { getGcpProjectId, getGcpCredentials, GcpCredentials } from "../_pubsub";

const MESSAGE_TTL_SECONDS = 300;
const MAX_MESSAGES_PER_PULL = 100;

export interface GaslessPubSubConfig {
  projectId: string;
  subscriptionName: string;
  topicName: string;
  messageTtlSeconds: number;
  maxMessagesPerPull: number;
  credentials?: GcpCredentials;
}

export function getGaslessPubSubConfig(): GaslessPubSubConfig {
  const projectId = getGcpProjectId();
  const subscriptionName = process.env.GASLESS_SUBSCRIPTION_NAME;
  const topicName =
    process.env.GASLESS_DEPOSITS_TOPIC || "topic-gasless-deposits";

  if (!subscriptionName) {
    throw new Error("GASLESS_SUBSCRIPTION_NAME must be set for gasless API");
  }

  return {
    projectId,
    subscriptionName,
    topicName,
    messageTtlSeconds: MESSAGE_TTL_SECONDS,
    maxMessagesPerPull: MAX_MESSAGES_PER_PULL,
    credentials: getGcpCredentials(),
  };
}
