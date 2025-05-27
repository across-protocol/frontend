import {
  Address,
  Hex,
  padHex,
  toBytes,
  toHex,
  trim,
  isAddress as isEvmAddress,
} from "viem";
import {
  getAddressDecoder,
  getAddressEncoder,
  isAddress as isSvmAddress,
} from "@solana/kit";

// exports
export { isSvmAddress, isEvmAddress };

export function svmToHex(pubkey: string): Hex {
  if (!isSvmAddress(pubkey)) {
    throw new Error("Invalid SVM Address");
  }
  const bytes = getAddressEncoder().encode(pubkey);
  return toHex(new Uint8Array(bytes));
}

export function hexToBase58(address: Address) {
  if (!isEvmAddress(address)) {
    throw new Error("Invalid EVM Address");
  }
  const bytes = trim(toBytes(address));
  return getAddressDecoder().decode(bytes);
}

export function toBytes32(value: string) {
  if (isSvmAddress(value)) {
    // byte length already checked at this stage
    return svmToHex(value);
  }
  if (isEvmAddress(value)) {
    return padHex(value, {
      size: 32,
      dir: "left",
    });
  }
  throw new Error("Invalid Address type. Must be valid EVM or SVM address");
}
