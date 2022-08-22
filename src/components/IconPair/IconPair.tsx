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
  bottom: 4px;
  height: 16px;
  width: 16px;
`;
