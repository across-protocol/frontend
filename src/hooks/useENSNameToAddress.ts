import { useState, useCallback } from "react";
import { ethers } from "ethers";

export default function useENSNameToAddress(
  referrer: string,
  provider: ethers.providers.Provider | undefined
) {
  const [address, setAddress] = useState<string | null | undefined>(null);
  const lookupAddress = useCallback(async () => {
    try {
      const resolvedAddress = await provider?.resolveName(referrer);
      setAddress(resolvedAddress);
    } catch (e) {
      console.log("error resolving name", e);
      setAddress(null);
    }
  }, [referrer, provider]);

  if (referrer && provider) lookupAddress();

  return address;
}
