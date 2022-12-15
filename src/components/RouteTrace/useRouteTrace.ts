import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function useRouteTrace() {
  const location = useLocation();
  const [initialPage, setInitialPage] = useState(true);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    if (location.pathname !== "" && currentPath !== location.pathname) {
      setCurrentPath(location.pathname);
    }
  }, [location, currentPath]);

  useEffect(() => {
    if (currentPath) {
      const referrer = document.referrer;
      const origin = window.location.origin;

      console.log(currentPath, referrer, "|", origin, initialPage);
      setInitialPage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);
}
