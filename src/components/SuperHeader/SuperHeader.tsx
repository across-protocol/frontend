import styled from "@emotion/styled";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { QUERIES } from "utils";

type Size = "sm" | "md" | "lg";
interface IWrapper {
  darkMode?: boolean;
  size?: Size;
}
const Wrapper = styled.div<IWrapper>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ size }) => (size === "lg" ? "0 30px" : "50px 30px")};
  height: 60px;
  color: ${({ darkMode }) => (darkMode ? "#fff" : "var(--color-gray)")};
  background-color: ${({ darkMode }) =>
    darkMode ? "#202024" : "var(--color-error)"};
  border-bottom: 1px solid var(--color-gray);
  position: unset;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 1100;
  & button {
    background-color: inherit;
    font-size: inherit;
    color: var(--color-gray);
    text-decoration: underline;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
    display: inline-flex;
    &:hover {
      color: var(--color-black);
    }
  }

  @media ${QUERIES.tabletAndDown} {
    height: inherit;
    padding-top: 10px;
    padding-bottom: 10px;
  }
`;

/**
 * React component that renders its children in a super header on top of the page.
 */

interface Props {
  darkMode?: boolean;
  size?: Size;
}
const SuperHeader: React.FC<Props> = ({ children, darkMode, size }) => {
  const container = useRef(document.getElementById("super-header"));
  // We create the "super-header" element and insert it into the DOM, if it does not exist already
  useLayoutEffect(() => {
    if (!container.current) {
      // we know this to always be defined.
      const root = document.getElementById("root") as HTMLDivElement;
      const div = document.createElement("div");
      div.id = "super-header";
      root.insertBefore(div, root.firstChild);
      container.current = div;
    }
  }, []);
  if (!container.current) {
    return null;
  }
  return createPortal(
    <Wrapper darkMode={darkMode} size={size}>
      {children}
    </Wrapper>,
    container.current
  );
};
export default SuperHeader;
