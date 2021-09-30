import React from "react";
import styled from "@emotion/styled";

type Size = "xl" | "lg" | "md" | "sm";
type Props = {
  size?: Size;
} & React.HTMLAttributes<HTMLDivElement>;

interface WrapperStyles extends React.CSSProperties {
  "--size": string;
}

const STYLES: Record<Size, WrapperStyles> = {
  xl: {
    "--size": "1280px",
  },
  lg: {
    "--size": "1028px",
  },
  md: {
    "--size": "900px",
  },
  sm: {
    "--size": "500px",
  },
};

const MaxWidthWrapper: React.FC<Props> = ({ size = "xl", ...delegated }) => (
  <Wrapper style={STYLES[size]} {...delegated} />
);

export default MaxWidthWrapper;

const Wrapper = styled.div`
  max-width: var(--size);
  margin: 0 auto;
  padding: 0 15px;
`;
