import { utils } from "ethers";

export const DOMAIN_CALLDATA_DELIMITER = "0x1dc0de";
export const SWAP_CALLDATA_MARKER = "0x73c0de";

export function isValidIntegratorId(integratorId: string) {
  return (
    utils.isHexString(integratorId) &&
    // "0x" + 2 bytes = 6 hex characters
    integratorId.length === 6
  );
}

export function assertValidIntegratorId(integratorId: string) {
  if (!isValidIntegratorId(integratorId)) {
    throw new Error(
      `Invalid integrator ID: ${integratorId}. Needs to be 2 bytes hex string.`
    );
  }

  return true;
}

export function tagIntegratorId(integratorId: string, txData: string) {
  assertValidIntegratorId(integratorId);

  return utils.hexlify(
    utils.concat([txData, DOMAIN_CALLDATA_DELIMITER, integratorId])
  );
}

export function tagSwapApiMarker(txData: string) {
  return utils.hexlify(utils.concat([txData, SWAP_CALLDATA_MARKER]));
}
