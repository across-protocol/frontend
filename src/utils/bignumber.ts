import { ReadonlyUint8Array } from "@solana/kit";
import { BigNumber, BigNumberish } from "ethers";
import { Hex, toHex } from "viem";

export function bigNumberifyObject<T>(obj: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([key, value]) => {
      if (isBigNumberish(value)) {
        return [key, BigNumber.from(value)];
      }

      if (typeof value === "object" && value !== null) {
        return [key, bigNumberifyObject(value as Record<string, unknown>)];
      }

      return [key, value];
    })
  ) as T;
}

export function isBigNumberish(value: unknown): value is BigNumberish {
  try {
    BigNumber.from(value);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Converts a Uint8Array to a BigNumber
 * @param array The Uint8Array to convert
 * @returns A BigNumber representation of the array
 */
export function uint8ArrayToBigNumber(
  array: Uint8Array | ReadonlyUint8Array
): BigNumber {
  return BigNumber.from(uin8ArrayToHex(array));
}

export function uin8ArrayToHex(array: Uint8Array | ReadonlyUint8Array): Hex {
  return toHex(
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
