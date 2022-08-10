import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function useENSNameToAddress(
  referrer: string,
  provider: ethers.providers.Provider | undefined
) {
  const [address, setAddress] = useState<string>("");
  const [referrerError, setReferrerError] = useState<string>("");
  useEffect(() => {
    if (provider && referrer) {
      setReferrerError("");
      if (!ethers.utils.isAddress(referrer)) {
        provider
          .resolveName(referrer)
          .then((ra) => {
            setAddress(ra || "");
            if (ra) {
              setReferrerError("");
            } else {
              setReferrerError("Invalid address or ENS name");
            }
          })
          .catch((e) => {
            // Error here would imply an issue with the provider call, not with the ENS name necessarily.
            console.warn("error resolving name", e);
            setAddress("");
            setReferrerError("");
          });
      }
    }
  }, [referrer, provider]);

  return { address, referrerError };
}
