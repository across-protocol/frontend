import { PubSub } from "@google-cloud/pubsub";
import type { GaslessSubmitBody } from "./gasless/submit/_validation";

let pubsubClient: PubSub | undefined;

function getPubSubClient(): PubSub {
  if (pubsubClient) {
    return pubsubClient;
  }

  const serviceAccountKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.GCP_PROJECT_ID;

  if (serviceAccountKey) {
    const credentials = JSON.parse(serviceAccountKey);
    pubsubClient = new PubSub({ projectId, credentials });
  } else {
    // Use default credentials (e.g., from GOOGLE_APPLICATION_CREDENTIALS env var)
    pubsubClient = new PubSub({ projectId });
  }

  return pubsubClient;
}

export type GaslessSubmissionMessage = {
  swapTx: GaslessSubmitBody["swapTx"];
  signature: string;
  submittedAt: string;
  requestId: string;
};

export async function publishGaslessSubmission(
  data: GaslessSubmissionMessage
): Promise<string> {
  const topicName = process.env.GASLESS_SUBMIT_TOPIC || "gasless-submissions";

  const client = getPubSubClient();
  const topic = client.topic(topicName);

  const messageBuffer = Buffer.from(JSON.stringify(data));
  const messageId = await topic.publishMessage({
    data: messageBuffer,
    attributes: {
      depositId: data.swapTx.data.depositId,
      chainId: String(data.swapTx.chainId),
      type: data.swapTx.data.type,
    },
  });

  return messageId;
}
