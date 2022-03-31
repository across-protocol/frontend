import styled from "@emotion/styled";
import { motion } from "framer-motion";
import { Info as UnstyledInfoIcon } from "react-feather";
import { AccentSection as UnstyledAccentSection } from "../Section";

export const AccentSection = styled(UnstyledAccentSection)`
  position: relative;
`;

export const InfoIcon = styled(UnstyledInfoIcon)`
  position: absolute;
  top: 30px;
  right: 0px;
  cursor: pointer;
  color: var(--color-gray);
  fill: currentColor;
  & > line {
    stroke: var(--color-white-transparent);
    transition: stroke 100ms linear;
  }
  &:hover > line {
    stroke: var(--color-white);
  }
`;

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 65px 0;
`;

export const Info = styled.div`
  display: flex;
  justify-content: space-between;

  &:not(:last-of-type) {
    margin-bottom: 16px;
  }
  &:last-of-type {
    margin-bottom: 32px;
  }
`;
export const InfoWrapper = motion.div;
