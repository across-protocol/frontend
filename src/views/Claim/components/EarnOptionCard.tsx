import React from "react";
import styled from "@emotion/styled";

import { IconPair } from "components/IconPair";
import { PopperTooltip } from "components/Tooltip";
import { ReactComponent as InfoIcon } from "assets/info.svg";
import { QUERIESV2 } from "utils/constants";

import { LightCard } from "./Card";
import { Button } from "../Claim.styles";

export function EarnOptionCard(props: {
  title: string;
  subTitle: string;
  buttonLabel: string;
  href: string;
  apyRange: number[];
  MainIcon: React.ReactElement;
  SmallIcon?: React.ReactElement;
}) {
  return (
    <Container>
      <EarnOptionTopContainer>
        <IconPairContainer>
          <IconPair MainIcon={props.MainIcon} SmallIcon={props.SmallIcon} />
        </IconPairContainer>
        <div>
          <h6>{props.title}</h6>
          <p>{props.subTitle}</p>
        </div>
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

const Container = styled(LightCard)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media ${QUERIESV2.sm} {
    gap: 24px;
  }
`;

const EarnOptionTopContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const IconPairContainer = styled.div`
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
