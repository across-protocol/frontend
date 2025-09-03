import { utils } from "@across-protocol/sdk";
import { DEFAULT_FILL_DEADLINE_BUFFER_SECONDS } from "./_constants";

function getFillDeadlineBuffer(chainId: number) {
  const bufferFromEnv = (
    JSON.parse(process.env.FILL_DEADLINE_BUFFER_SECONDS || "{}") as Record<
      string,
      string
    >
  )?.[chainId.toString()];
  return Number(bufferFromEnv ?? DEFAULT_FILL_DEADLINE_BUFFER_SECONDS);
}

export function getFillDeadline(chainId: number): number {
  const fillDeadlineBuffer = getFillDeadlineBuffer(chainId);
  return utils.getCurrentTime() + fillDeadlineBuffer;
}
