import * as sdk from "@across-protocol/sdk";

import { DEFAULT_FILL_DEADLINE_BUFFER_SECONDS } from "./_constants";
import { getSvmSpokeState, getSpokePool } from "./_spoke-pool";

function getFillDeadlineBuffer(chainId: number) {
  const bufferFromEnv = (
    JSON.parse(process.env.FILL_DEADLINE_BUFFER_SECONDS || "{}") as Record<
      string,
      string
    >
  )?.[chainId.toString()];
  return Number(bufferFromEnv ?? DEFAULT_FILL_DEADLINE_BUFFER_SECONDS);
}

export async function getFillDeadline(chainId: number): Promise<number> {
  const fillDeadlineBuffer = getFillDeadlineBuffer(chainId);
  let currentTime: number;

  if (sdk.utils.chainIsSvm(chainId)) {
    const svmSpokeState = await getSvmSpokeState(chainId);
    currentTime = svmSpokeState.data.currentTime;
  } else {
    const spokePool = getSpokePool(chainId);
    currentTime = (await spokePool.callStatic.getCurrentTime()).toNumber();
  }
  return currentTime + fillDeadlineBuffer;
}
