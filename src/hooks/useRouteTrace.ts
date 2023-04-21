import useReferrer from "hooks/useReferrer";
import { useAmplitude } from "hooks";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { currentGitCommitHash, getPageValue } from "utils";
import { ampli } from "ampli";

export function useRouteTrace() {
  const location = useLocation();
  const { referrer: referralAddress, isResolved: isReferralAddressResolved } =
    useReferrer();
  const [initialPage, setInitialPage] = useState(true);
  const [path, setPath] = useState("");
  const { addToAmpliQueue } = useAmplitude();

  useEffect(() => {
    if (location.pathname !== "" && path !== location.pathname) {
      setPath(location.pathname);
    }
  }, [location, path]);

  useEffect(() => {
    if (path && isReferralAddressResolved) {
      const referrer = document.referrer;
      const origin = window.location.origin;
      const page = getPageValue();
      addToAmpliQueue(() => {
        ampli.pageViewed({
          path,
          referrer,
          origin,
          isInitialPageView: initialPage,
          page,
          gitCommitHash: currentGitCommitHash,
          referralProgramAddress: referralAddress,
        });
      });

      if (initialPage) {
        setInitialPage(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, isReferralAddressResolved]);
}
