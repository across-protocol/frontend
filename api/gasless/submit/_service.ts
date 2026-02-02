import { assert } from "superstruct";

import { GaslessSubmitBody, GaslessSubmitBodySchema } from "./_validation";
import { getSpokePoolPeripheryAddress } from "../../_spoke-pool-periphery";
import { InvalidParamError } from "../../_errors";
import { publishGaslessSubmission } from "../../_pubsub";

export type GaslessSubmitResponse = {
  depositId: string;
  messageId: string;
  status: "queued";
};

export async function handleGaslessSubmit(
  body: GaslessSubmitBody,
  requestId: string
): Promise<GaslessSubmitResponse> {
  // Validate request body structure
  assert(body, GaslessSubmitBodySchema);

  const swapTx = body.swapTx;
  const signature = body.signature;
  const chainId = swapTx.chainId;
  const targetAddress = swapTx.to as string;
  const depositId = swapTx.data.depositId;

  // Verify swapTx.to is a valid SpokePoolPeriphery for the given chainId
  const peripheryAddress = getSpokePoolPeripheryAddress(chainId, false) as
    | string
    | undefined;
  if (
    !peripheryAddress ||
    peripheryAddress.toLowerCase() !== targetAddress.toLowerCase()
  ) {
    throw new InvalidParamError({
      message: `Invalid target address. Expected SpokePoolPeriphery at ${peripheryAddress} for chain ${chainId}, got ${targetAddress}`,
      param: "swapTx.to",
    });
  }

  // Publish to Pub/Sub
  const messageId = await publishGaslessSubmission({
    swapTx,
    signature,
    submittedAt: new Date().toISOString(),
    requestId,
  });

  return {
    depositId,
    messageId,
    status: "queued",
  };
}
