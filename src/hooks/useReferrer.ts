import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "state/hooks";

export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam } = useQueryParams();

  // Default to referrer if query ref isn't provided.
  const r = refParam || referrer;

  const [address, setAddress] = useState<string>("");
  const [error, setError] = useState<string>("");
  useEffect(() => {
    setError("");
    if (provider && r) {
      if (ethers.utils.isAddress(r)) {
        return setAddress(r);
      }

      provider
        .resolveName(r)
        .then((ra) => {
          setAddress(ra || "");
          if (!ra) {
            setError("Invalid referral ENS name");
          }
        })
        .catch((e) => {
          // Error here would imply an issue with the provider call, not with the ENS name necessarily.
          console.warn("error resolving name", e);
          setAddress("");
          if (!ethers.utils.isAddress(r)) {
            setError("Invalid referral address");
          }
        });
    }
    // eslint-disable-next-line
  }, [provider, r]);
  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address, error };
}
