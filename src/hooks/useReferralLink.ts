import { useEffect, useState } from "react";
import { shortenString } from "utils";
import { useConnection } from "./useConnection";

export function useReferralLink() {
  const { account } = useConnection();
  const [referralLink, setReferralLink] = useState<string | undefined>(
    undefined
  );
  const [referralLinkWithProtocol, setReferralLinkWithProtocol] = useState<
    string | undefined
  >(undefined);
  const [condensedReferralLink, setCondensedReferralLink] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const baseUrl = "across.to/?ref=";
    const fullUrl = `${baseUrl}${account ?? ""}`;
    const condensedUrl = `${baseUrl}${shortenString(account ?? "", "..", 4)}`;

    setReferralLink(fullUrl);
    setCondensedReferralLink(condensedUrl);
    setReferralLinkWithProtocol(`https://${fullUrl}`);
  }, [account]);

  return { referralLink, referralLinkWithProtocol, condensedReferralLink };
}
