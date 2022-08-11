import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "state/hooks";

export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam } = useQueryParams();
  // Default to referrer if query ref isn't provided.
  let r = refParam || referrer;

  const [address, setAddress] = useState<string>("");
  const [referrerError, setReferrerError] = useState<string>("");
  useEffect(() => {
    if (provider && r) {
      setReferrerError("");
      if (!ethers.utils.isAddress(r)) {
        provider
          .resolveName(r)
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
  }, [provider, r]);
  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address, referrerError };
}
