import styled from "@emotion/styled";
import React from "react";

type Props = {
  MainIcon: React.ReactElement;
  SmallIcon?: React.ReactElement;
};

export function IconPair(props: Props) {
  return (
    <Container>
      <MainIconContainer>{props.MainIcon}</MainIconContainer>
      {props.SmallIcon && (
        <SmallIconContainer>{props.SmallIcon}</SmallIconContainer>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
`;

const MainIconContainer = styled.div`
  height: 32px;
  width: 32px;
`;

const SmallIconContainer = styled.div`
  position: absolute;
  right: -8px;
  bottom: -1px;
  height: 18px;
  width: 18px;

  svg {
    border: 2px solid #3e4047;
    border-radius: 50%;
  }
`;
