import { useState, useMemo, useEffect } from "react";

export function useCenteredInViewport(
  ref: React.MutableRefObject<Element | null>
) {
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
    if (ref.current !== null) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, observer]);

  return isIntersecting;
}
