import styled from "@emotion/styled";
import { Link as UnstyledLink } from "react-router-dom";
import { motion } from "framer-motion";

interface IWrapper {
  scrollPosition: number;
  transparentHeader?: boolean;
}
export const Wrapper = styled.header<IWrapper>`
  /* 
    Note: This code segment utilizes the scroll position to create
          a dynamic fade that increases to a maximum of 94% opacity
          as the user scrolls down the page. 

          The opacity function is set as O = MIN(0.94, 2*{pixels_from_top}/255)
  */
  background-color: ${({ transparentHeader, scrollPosition }) =>
    transparentHeader
      ? `#2d2e33${Math.min(240, Math.floor(2.5 * scrollPosition))
          .toString(16)
          .padStart(2, "0")}`
      : "#2d2e33"};

  height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  color: #c5d5e0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: ${({ scrollPosition }) => {
    return scrollPosition > 0 ? "1px solid #4d4f56" : "1px solid transparent";
  }};

  @media (max-width: 428px) {
    height: 64px;
    padding: 0 12px;
  }
`;

export const Navigation = styled.nav`
  height: 100%;
  display: flex;
  margin-left: 48px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

export const Spacing = styled.div`
  flex-grow: 1;
`;

export const List = styled.ul`
  display: flex;
  list-style: none;
  font-size: ${18 / 16}rem;
`;

export const Item = styled.li`
  position: relative;
  margin: 0 24px 0 0;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 400;
  color: #c5d5e0;
  background-color: inherit;
  cursor: pointer;

  &[aria-selected="true"] {
    font-weight: 500;
    color: #e0f3ff;

    ::after {
      content: "";
      position: absolute;
      top: 56px;
      left: 50%;
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background-color: #e0f3ff;
      transform: translateX(-50%);
    }
  }

  :hover {
    color: #e0f3ff;
  }
`;
export const BaseLink = styled(UnstyledLink)`
  display: block;
  text-decoration: none;
  color: inherit;
  outline: none;
  height: 100%;
  width: 100%;
`;

export const Link = styled(BaseLink)`
  display: grid;
  place-items: center;
`;

export const WalletWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const MobileNavigation = styled(motion.nav)`
  margin-left: 16px;

  @media (max-width: 428px) {
    margin-left: 8px;
  }
`;
