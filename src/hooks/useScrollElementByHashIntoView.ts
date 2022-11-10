import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollElementByHashIntoView() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
        });
      }
    }
    // eslint-disable-next-line
  }, []);

  return null;
}

export default useScrollElementByHashIntoView;
