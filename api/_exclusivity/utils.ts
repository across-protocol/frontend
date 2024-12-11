import { ethers } from "ethers";

// TODO: get this from gh
export const whiteListedRelayers = [
  "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D", // dev wallet
];

export const getRelayerFromSignature = async (
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
