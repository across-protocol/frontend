import { ethers } from "ethers";
import { bnZero } from "../../src/utils/sdk";
import { RelayerFillLimit } from "../_types";

export const MAX_MESSAGE_AGE_SECONDS = 300;

// TODO: get this from gh
export const whiteListedRelayers = [
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D", // dev wallet
];

export const getRelayerFromSignature = (
  signature: string,
  message: string
) => {
  return ethers.utils.verifyMessage(message, signature);
};

export const isTimestampValid = (
  timestamp: number,
  maxAgeSeconds: number
): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - timestamp <= maxAgeSeconds;
};

export async function updateLimits(
  relayer: string,
  limits: RelayerFillLimit[]
): Promise<void> {
  const sortedLimits = limits
    .map(({ minOutputAmount, maxOutputAmount, ...rest }) => ({
      minOutputAmount: ethers.BigNumber.from(minOutputAmount),
      maxOutputAmount: ethers.BigNumber.from(maxOutputAmount),
      ...rest,
    }))
    .sort(({ minOutputAmount: minA }, { minOutputAmount: minB }) =>
      minA.sub(minB).gte(bnZero) ? 1 : -1
    );

  const sorted = sortedLimits
    .slice(1)
    .every(({ minOutputAmount, maxOutputAmount }, idx) => {
      const { maxOutputAmount: prevMax } = sortedLimits[idx];
      return maxOutputAmount.gt(minOutputAmount) && minOutputAmount.gt(prevMax);
    });

  if (!sorted) {
    throw new Error("Relayer limits are overlapping");
  }

  // todo: Push each limit entry to the backend cache/db.
  // The config types need to be reverted to strings as numbers.
  relayer; 

  return;
}
