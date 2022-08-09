import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function useENSNameToAddress(
  referrer: string,
  provider: ethers.providers.Provider | undefined
) {
  const [address, setAddress] = useState<string>("");
  useEffect(() => {
    if (provider && referrer) {
      lookupAddress(referrer, provider).then(setAddress);
    }
  }, [referrer, provider]);

  return address;
}

/**
 *
 * @param referrer
 * @param provider
 * @returns Promise<string>, resolves to the address of the ENS name if it exists
 */
async function lookupAddress(
  referrer: string,
  provider: ethers.providers.Provider
) {
  try {
    const resolvedAddress = await provider.resolveName(referrer);
    return resolvedAddress || "";
  } catch (e) {
    console.log("error resolving name", e);
    return "";
  }
}
