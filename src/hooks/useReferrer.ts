import { useState, useEffect, useMemo } from "react";
import { ethers, utils } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "hooks";
import { isDefined } from "utils";

export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam, integrator_id } = useQueryParams();

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

  // Return the integratorId as a hex string with a 0x prefix if not already present.
  // Default to Across if no integrator_id is provided or if the integrator_id is invalid.
  const integratorId = useMemo(() => {
    const integrator_modified = integrator_id?.includes("0x")
      ? integrator_id
      : `0x${integrator_id}`;

    if (utils.isHexString(integrator_modified)) {
      return integrator_modified.toLowerCase();
    }
    // Default to Across if no integrator_id is provided
    // or if the integrator_id is invalid.
    return "0x0000";
  }, [integrator_id]);

  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address, error, isResolved, integratorId };
}
