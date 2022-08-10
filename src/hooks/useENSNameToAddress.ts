import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function useENSNameToAddress(
  referrer: string,
  provider: ethers.providers.Provider | undefined
) {
  const [address, setAddress] = useState<string>("");
  useEffect(() => {
    if (provider && referrer) {
      provider
        .resolveName(referrer)
        .then((ra) => {
          setAddress(ra || "");
        })
        .catch((e) => {
          console.warn("error resolving name", e);
          setAddress("");
        });
    }
  }, [referrer, provider]);

  return address;
}
