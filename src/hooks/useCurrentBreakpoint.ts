import { throttle } from "lodash-es";
import { useState, useEffect } from "react";

type breakponts = "desktop" | "tablet" | "mobile";

const useCurrentBreakpoint = () => {
  const [windowSize, setWindowSize] = useState<number>(Number.MAX_SAFE_INTEGER);

  useEffect(() => {
    const updateWidthCore = () => {
      setWindowSize(window.innerWidth);
    };
    const updateWidth = throttle(updateWidthCore, 1500);
    window.addEventListener("resize", updateWidth);
    updateWidthCore();
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const breakpoint: breakponts =
    windowSize > 1024 ? "desktop" : windowSize > 576 ? "tablet" : "mobile";
  const tabletAndUp = breakpoint !== "mobile";
  const tabletAndDown = breakpoint !== "desktop";

  return {
    windowSize,
    breakpoint,
    helpers: {
      tabletAndUp,
      tabletAndDown,
    },
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isDesktop: breakpoint === "desktop",
  };
};

export default useCurrentBreakpoint;
