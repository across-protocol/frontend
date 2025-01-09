import { DEFAULT_FILL_DEADLINE_BUFFER_SECONDS } from "./_constants";
import { getSpokePool } from "./_utils";

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
  const spokePool = getSpokePool(chainId);
  const currentTime = await spokePool.callStatic.getCurrentTime();
  return Number(currentTime) + fillDeadlineBuffer;
}
