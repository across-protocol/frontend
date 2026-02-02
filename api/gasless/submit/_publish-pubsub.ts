import { getPubSubClient } from "../../_pubsub";
import { getLogger } from "../../_utils";
import { getGaslessPubSubConfig } from "../_config";
import { GaslessSubmitBody } from "./_validation";

export type GaslessDepositMessage = {
  swapTx: GaslessSubmitBody["swapTx"];
  signature: string;
  submittedAt: string;
  requestId: string;
};

const logger = getLogger();

export async function publishGaslessDepositMessage(
  data: GaslessDepositMessage
): Promise<string> {
  const client = getPubSubClient();
  const config = getGaslessPubSubConfig();

  try {
    const topic = client.topic(config.topicName);

    const messageBuffer = Buffer.from(JSON.stringify(data));
    const messageId = await topic.publishMessage({
      data: messageBuffer,
    });

    return messageId;
  } catch (error) {
    logger.error({
      at: "gasless/submit/_publish-pubsub",
      message: "Failed to publish gasless deposit",
      error,
    });
    throw error;
  } finally {
    await client.close();
  }
}
