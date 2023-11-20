import { useMemo } from "react";
import { shortenString, resolveWebsiteUrl } from "utils";
import { useConnection } from "./useConnection";

export function useReferralLink() {
  const { account } = useConnection();
  return useMemo(() => {
    const protocolUrl = resolveWebsiteUrl();
    const domain = new URL(protocolUrl).hostname;
    const addRef = (url: string, r?: string) =>
      `${url}?ref=${r ?? account ?? ""}`;
    return {
      referralLink: addRef(domain),
      referralLinkWithProtocol: addRef(protocolUrl),
      condensedReferralLink: addRef(
        domain,
        shortenString(account ?? "", "..", 4)
      ),
    };
  }, [account]);
}
