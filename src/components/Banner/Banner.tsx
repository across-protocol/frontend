import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Wrapper } from "./Banner.styles";
/**
 * React component that renders its children in a super header on top of the page.
 */
const Banner: React.FC = ({ children }) => {
  const container = useRef(document.getElementById("banner"));
  // We create the "super-header" element and insert it into the DOM, if it does not exist already
  useLayoutEffect(() => {
    if (!container.current) {
      // we know this to always be defined.
      const root = document.getElementById("root") as HTMLDivElement;
      const div = document.createElement("div");
      div.id = "banner";
      root.insertBefore(div, root.firstChild);
      container.current = div;
    }
  }, []);
  if (!container.current) {
    return null;
  }
  return createPortal(<Wrapper>{children}</Wrapper>, container.current);
};

export default Banner;
