import { CCTP_FILL_TIME_ESTIMATES } from "./constants";

export const getEstimatedFillTime = (
  originChainId: number,
  standardOrFast: "standard" | "fast" = "standard"
): number => {
  const fallback = standardOrFast === "standard" ? 19 * 60 : 8;
  // CCTP fill time is determined by the origin chain attestation process
  return CCTP_FILL_TIME_ESTIMATES[standardOrFast][originChainId] || fallback;
};
