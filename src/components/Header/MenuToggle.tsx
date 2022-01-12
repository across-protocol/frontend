import React from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";

type MenuToggleProps = {
  toggle: () => void;
};

const MenuToggle: React.FC<MenuToggleProps> = ({ toggle }) => {
  return (
    <CloseButton onClick={() => toggle()}>
      <Slice
        variants={{
          open: {
            y: [0, 0],
            rotate: [0, 45],
          },
          closed: {
            y: 10,
            rotate: 0,
          },
        }}
      />
      <Slice
        variants={{
          open: {
            opacity: 0,
          },
          closed: {
            opacity: 1,
          },
        }}
      />
      <Slice
        variants={{
          open: {
            y: [0, 0],
            rotate: [0, -45],
          },
          closed: {
            y: -10,
            rotate: 0,
          },
        }}
      />
    </CloseButton>
  );
};

export default MenuToggle;

const Slice = styled(motion.div)`
  position: absolute;
  left: 0;
  right: 0;
  min-height: 2px;
  background-color: var(--color-gray);
`;

const CloseButton = styled.button`
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  background-color: transparent;
  cursor: pointer;
  outline: none;
`;
