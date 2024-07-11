import styled from "@emotion/styled";
import React from "react";

import { COLORS } from "utils";

type BorderColor = keyof typeof COLORS;

type Props = {
  LeftIcon: React.ReactElement;
  RightIcon: React.ReactElement;
  iconSize?: number;
  borderColor?: BorderColor;
};

export function IconPair(props: Props) {
  return (
    <Container borderColor={props.borderColor}>
      <LeftIconContainer iconSize={props.iconSize}>
        {props.LeftIcon}
      </LeftIconContainer>
      <RightIconContainer iconSize={props.iconSize}>
        {props.RightIcon}
      </RightIconContainer>
    </Container>
  );
}

const Container = styled.div<{ borderColor?: BorderColor }>`
  position: relative;

  img,
  svg {
    border: 2px solid ${({ borderColor }) => COLORS[borderColor || "black-800"]};
    border-radius: 50%;
    background-color: ${({ borderColor }) =>
      COLORS[borderColor || "black-800"]};
  }
`;

const LeftIconContainer = styled.div<{ iconSize?: number }>`
  height: ${({ iconSize = 32 }) => iconSize}px;
  width: ${({ iconSize = 32 }) => iconSize}px;

  img {
    height: ${({ iconSize = 32 }) => iconSize}px;
    width: ${({ iconSize = 32 }) => iconSize}px;
  }
`;

const RightIconContainer = styled.div<{ iconSize?: number }>`
  position: absolute;
  right: -${({ iconSize = 32 }) => iconSize / 1.75}px;
  bottom: 0px;
  height: ${({ iconSize = 32 }) => iconSize}px;
  width: ${({ iconSize = 32 }) => iconSize}px;

  img {
    height: ${({ iconSize = 32 }) => iconSize}px;
    width: ${({ iconSize = 32 }) => iconSize}px;
  }
`;
