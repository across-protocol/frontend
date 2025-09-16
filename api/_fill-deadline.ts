import * as sdk from "@across-protocol/sdk";

import { DEFAULT_FILL_DEADLINE_BUFFER_SECONDS } from "./_constants";
import { getSpokePool } from "./_spoke-pool";
import { getSVMRpc } from "./_providers";

export function getFillDeadlineBuffer(chainId: number) {
  const bufferFromEnv = (
    JSON.parse(process.env.FILL_DEADLINE_BUFFER_SECONDS || "{}") as Record<
      string,
      string
    >
  )?.[chainId.toString()];
  return Number(bufferFromEnv ?? DEFAULT_FILL_DEADLINE_BUFFER_SECONDS);
}

async function getCurrentTimeSvm(chainId: number): Promise<number> {
  const rpc = getSVMRpc(chainId);
  const timestamp = await rpc
    .getSlot({
      commitment: "confirmed",
    })
    .send()
    .then((slot) => rpc.getBlockTime(slot).send());
  return Number(timestamp);
}

export async function getFillDeadline(chainId: number): Promise<number> {
  const fillDeadlineBuffer = getFillDeadlineBuffer(chainId);
  let currentTime: number;

  if (sdk.utils.chainIsSvm(chainId)) {
    currentTime = await getCurrentTimeSvm(chainId);
  } else {
    const spokePool = getSpokePool(chainId);
    currentTime = (await spokePool.callStatic.getCurrentTime()).toNumber();
  }
  return currentTime + fillDeadlineBuffer;
}
