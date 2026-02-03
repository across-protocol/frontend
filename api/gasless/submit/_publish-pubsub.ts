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

function witnessToAvroUnion(
  witness: GaslessSubmitBody["swapTx"]["data"]["witness"]
): Record<string, unknown> {
  if (witness.type === "BridgeWitness") {
    return { BridgeWitness: witness };
  }
  return { BridgeAndSwapWitness: witness };
}

function toPubSubPayload(
  message: GaslessDepositMessage
): Record<string, unknown> {
  const { swapTx, signature, submittedAt, requestId } = message;
  const data = swapTx.data;

  const typedData =
    "typedData" in swapTx && swapTx.typedData != null
      ? { TypedDataReceiveWithAuthorizationEIP712: swapTx.typedData }
      : null;

  return {
    swapTx: {
      ecosystem: "evm_gasless",
      chainId: swapTx.chainId,
      to: swapTx.to,
      typedData,
      data: {
        type: data.type,
        depositId: data.depositId,
        witness: witnessToAvroUnion(data.witness),
        permit: data.permit,
        domainSeparator: data.domainSeparator,
        integratorId: data.integratorId || null,
      },
    },
    signature,
    submittedAt,
    requestId,
  };
}

export async function publishGaslessDepositMessage(
  data: GaslessDepositMessage
): Promise<string> {
  const client = getPubSubClient();
  const config = getGaslessPubSubConfig();

  try {
    const topic = client.topic(config.topicName);
    const payload = toPubSubPayload(data);
    const messageBuffer = Buffer.from(JSON.stringify(payload));
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
