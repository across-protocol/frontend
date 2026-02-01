import { getEnvs } from "../_env";

const MESSAGE_TTL_SECONDS = 300;
const MAX_MESSAGES_PER_PULL = 100;

export interface GaslessPubSubConfig {
  projectId: string;
  subscriptionName: string;
  messageTtlSeconds: number;
  maxMessagesPerPull: number;
  /** When set (e.g. on Vercel), used to authenticate with Pub/Sub instead of ADC. */
  credentials?: { client_email: string; private_key: string };
}

export function getGaslessPubSubConfig(): GaslessPubSubConfig {
  const env = getEnvs();
  const projectId = env.GCP_PROJECT_ID;
  const subscriptionName = env.GASLESS_SUBSCRIPTION_NAME;
  const clientEmail = env.GCP_CLIENT_EMAIL;
  const privateKey = env.GCP_PRIVATE_KEY;

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID must be set for gasless API");
  }
  if (!subscriptionName) {
    throw new Error("GASLESS_SUBSCRIPTION_NAME must be set for gasless API");
  }

  const credentials =
    clientEmail && privateKey
      ? {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, "\n"),
        }
      : undefined;

  return {
    projectId,
    subscriptionName,
    messageTtlSeconds: MESSAGE_TTL_SECONDS,
    maxMessagesPerPull: MAX_MESSAGES_PER_PULL,
    credentials,
  };
}
