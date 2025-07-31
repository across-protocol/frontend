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

export function getFillDeadline(
  chainId: number,
  quoteTimestamp: number
): number {
  const fillDeadlineBuffer = getFillDeadlineBuffer(chainId);
  // Quote timestamp cannot be in the future or more than an hour old, so this is safe (i.e. cannot
  // cause the contract to revert) as long as the fill deadline buffer is at least 1 hour smaller
  // than the maximum buffer length allowed by the contract.
  return Number(quoteTimestamp) + fillDeadlineBuffer;
}
