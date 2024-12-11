import { ethers } from "ethers";

export const MAX_MESSAGE_AGE_SECONDS = 300;

// TODO: get this from gh
export const getWhiteListedRelayers = () => {
  return [
    "0x9A8f92a830A5cB89a3816e3D267CB7791c16b04D", // dev wallet
  ];
};

export const getRelayerFromSignature = (signature: string, message: string) => {
  return ethers.utils.verifyMessage(message, signature);
};

export const isTimestampValid = (
  timestamp: number,
  maxAgeSeconds: number
): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - timestamp <= maxAgeSeconds;
};
