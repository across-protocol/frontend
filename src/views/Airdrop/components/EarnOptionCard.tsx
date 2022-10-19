import React from "react";
import styled from "@emotion/styled";

import { Text } from "components/Text";
import { PopperTooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/icons/info-16.svg";
import { QUERIESV2 } from "utils/constants";

import { Button } from "../Airdrop.styles";

export function EarnOptionCard(props: {
  title: string;
  subTitle: string;
  buttonLabel: string;
  href: string;
  apyRange: number[];
  MainIcon: React.ReactElement;
}) {
  return (
    <Container>
      <EarnOptionTopContainer>
        <IconContainer>{props.MainIcon}</IconContainer>
        <TextContainer>
          <Text size="lg" color="white-100">
            {props.title}
          </Text>
          <Text size="lg" color="white-88">
            {props.subTitle}
          </Text>
        </TextContainer>
      </EarnOptionTopContainer>
      <FullWidthButton size="lg">{props.buttonLabel}</FullWidthButton>
      <ApyContainer>
        APY: {props.apyRange[0]} — {props.apyRange[1]}%{" "}
        <PopperTooltip title="APY" body="APY info text" placement="top">
          <InfoIcon />
        </PopperTooltip>
      </ApyContainer>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
  justify-content: space-between;
  align-items: center;
  padding: 24px;

  background-color: #3e4047;

  border: 1px solid #4c4e57;
  border-radius: 10px;

  @media ${QUERIESV2.sm.andDown} {
    gap: 24px;
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EarnOptionTopContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const IconContainer = styled.div`
  margin-right: 18px;
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;

const ApyContainer = styled.div`
  border-top: 1px solid #4c4e57;
  width: 100%;
  padding-top: 16px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  line-height: ${20 / 16}rem;
`;
