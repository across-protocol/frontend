import React from "react";
import styled from "@emotion/styled";

import { Card } from "./Card";

type Props = {
  Icon: React.ReactElement;
  Body: React.ReactElement;
};

export function InfoCard(props: Props) {
  return (
    <ContainerCard>
      <IconContainer>{props.Icon}</IconContainer>
      {props.Body}
    </ContainerCard>
  );
}

const IconContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  padding: ${10 / 16}rem;
  width: ${64 / 16}rem;
  height: ${64 / 16}rem;

  border: 1px solid #4c4e57;
  border-radius: 50%;
`;

const ContainerCard = styled(Card)`
  padding-bottom: ${48 / 16}rem;
`;
