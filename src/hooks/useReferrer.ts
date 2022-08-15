import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "state/hooks";
// import { useToast } from "components/Toast/useToast";

export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam } = useQueryParams();
  // const { addToast } = useToast();

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

      if (r.slice(-4) === ".eth") {
        provider
          .resolveName(r)
          .then((ra) => {
            setAddress(ra || "");
            if (!ra) {
              setError("Invalid referral ENS name");

              // addToast({
              //   type: "error",
              //   title: "Error",
              //   body: "Invalid referral ENS name",
              // });
            }
          })
          .catch((e) => {
            // Error here would imply an issue with the provider call, not with the ENS name necessarily.
            console.warn("error resolving name", e);
            setAddress("");
            if (!ethers.utils.isAddress(r)) {
              setError("Invalid referral address");
              // addToast({
              //   type: "error",
              //   title: "Error",
              //   body: "Invalid referral address",
              // });
            }
          });
      } else {
        setError("Invalid referral address");
        // return addToast({
        //   type: "error",
        //   title: "Error",
        //   body: "Invalid referral address",
        // });
      }
    }
    // eslint-disable-next-line
  }, [provider, r]);
  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address, error };
}
