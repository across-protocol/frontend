import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQueryParams } from "./useQueryParams";
import { useConnection } from "state/hooks";
import { useToast } from "components/ToastContainer/useToast";
import infoIcon from "assets/icons/info-24.svg";
export default function useReferrer() {
  const { provider } = useConnection();
  const { referrer, ref: refParam } = useQueryParams();
  const { addToast } = useToast();

  // Default to referrer if query ref isn't provided.
  const r = refParam || referrer;

  const [address, setAddress] = useState<string>("");
  useEffect(() => {
    if (provider && r) {
      if (!ethers.utils.isAddress(r)) {
        provider
          .resolveName(r)
          .then((ra) => {
            setAddress(ra || "");
            if (!ra) {
              addToast({
                icon: infoIcon,
                title: "Error",
                body: "Invalid referral ENS name",
              });
            }
          })
          .catch((e) => {
            // Error here would imply an issue with the provider call, not with the ENS name necessarily.
            console.warn("error resolving name", e);
            setAddress("");
            if (!ethers.utils.isAddress(r)) {
              addToast({
                icon: infoIcon,
                title: "Error",
                body: "Invalid referral address",
              });
            }
          });
      } else {
        setAddress(r);
      }
    }
  }, [provider, r, addToast]);
  // If ref and referrer params exist, prefer referrer param.
  // Not likely to happen but should have a catch if we get a bad link.
  // TODO? Test which of these is a good value?
  return { referrer: address };
}
