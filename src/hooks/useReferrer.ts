import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "hooks";
import { isDefined } from "utils";

export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam } = useQueryParams();

  // Default to referrer if query ref isn't provided.
  const r = refParam || referrer;

  const [address, setAddress] = useState<string>("");
  const [isResolved, setIsResolved] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  useEffect(() => {
    setError("");
    if (isDefined(r)) {
      if (ethers.utils.isAddress(r)) {
        setIsResolved(true);
        setAddress(r);
      } else if (isDefined(provider)) {
        provider
          .resolveName(r)
          .then((ra) => {
            setAddress(ra || "");
            setIsResolved(true);
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
          })
          .finally(() => {
            setIsResolved(true);
          });
      }
    } else {
      setIsResolved(true);
    }
  }, [provider, r]);
  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address, error, isResolved };
}
