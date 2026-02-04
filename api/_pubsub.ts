import { PubSub, v1 } from "@google-cloud/pubsub";

export type GcpCredentials = {
  client_email: string;
  private_key: string;
};

/**
 * Get GCP credentials from environment variables.
 * Supports two formats:
 * 1. GCP_SERVICE_ACCOUNT_KEY (JSON string with full service account)
 * 2. GCP_CLIENT_EMAIL + GCP_PRIVATE_KEY (individual fields)
 */
export function getGcpCredentials(): GcpCredentials | undefined {
  const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    const parsed = JSON.parse(serviceAccountKey);
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  const privateKey = process.env.GCP_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    };
  }

  return undefined;
}

export function getGcpProjectId(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error("GCP_PROJECT_ID must be set");
  }
  return projectId;
}

export function getPubSubClient(): PubSub {
  const projectId = getGcpProjectId();
  const credentials = getGcpCredentials();

  const client = credentials
    ? new PubSub({ projectId, credentials })
    : new PubSub({ projectId });

  return client;
}

let cachedSubscriberClient: v1.SubscriberClient | null = null;

export function getSubscriberClient(): v1.SubscriberClient {
  if (!cachedSubscriberClient) {
    const projectId = getGcpProjectId();
    const credentials = getGcpCredentials();
    cachedSubscriberClient = new v1.SubscriberClient(
      credentials ? { projectId, credentials } : { projectId }
    );
  }
  return cachedSubscriberClient;
}
