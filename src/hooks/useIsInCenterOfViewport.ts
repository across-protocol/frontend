import { useState, useMemo, useEffect } from "react";

export function useIsInCenterOfViewport(ref: any) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(
        ([entry]) => setIsIntersecting(entry.isIntersecting),
        {
          /**
           * This rootMargin creates a horizontal line vertically centered
           * that will help trigger an intersection at that y point.
           */
          rootMargin: "-50% 0% -50% 0%",
        }
      ),
    []
  );

  useEffect(() => {
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, observer]);

  return isIntersecting;
}
