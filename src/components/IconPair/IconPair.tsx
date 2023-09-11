import styled from "@emotion/styled";
import React from "react";

type Props = {
  LeftIcon: React.ReactElement;
  RightIcon: React.ReactElement;
};

export function IconPair(props: Props) {
  return (
    <Container>
      <LeftIconContainer>{props.LeftIcon}</LeftIconContainer>
      <RightIconContainer>{props.RightIcon}</RightIconContainer>
    </Container>
  );
}

const Container = styled.div`
  position: relative;

  img,
  svg {
    border: 2px solid #2d2e33ff;
    border-radius: 50%;
  }
`;

const LeftIconContainer = styled.div`
  height: 32px;
  width: 32px;
`;

const RightIconContainer = styled.div`
  position: absolute;
  right: -18px;
  bottom: 0px;
  height: 32px;
  width: 32px;
`;
