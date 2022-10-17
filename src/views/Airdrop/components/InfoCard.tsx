import styled from "@emotion/styled";
import React from "react";

import bgImage from "assets/airdrop-waves-bg.svg";
import { QUERIES } from "utils";
import { Text } from "components/Text";

import InfoCardTop from "./InfoCardTop";

type Props = {
  Icon: React.FunctionComponent;
  title: string;
  description: string;
  acxTokenAmount: string;
  "data-cy"?: string;
};

const InfoCard = ({
  Icon,
  title,
  description,
  acxTokenAmount,
  ...restProps
}: Props) => (
  <Wrapper data-cy={restProps["data-cy"]}>
    <InfoCardTop Icon={Icon} title={title} acxTokenAmount={acxTokenAmount} />
    <DescriptionWrapper>
      <Text size="sm">{description}</Text>
    </DescriptionWrapper>
  </Wrapper>
);

export default InfoCard;

const Wrapper = styled.div`
  width: 100%;
  position: relative;

  border-radius: 16px;

  display: flex;
  flex-direction: column;
  gap: 32px;

  overflow: clip;

  background-color: #2d2e33;
  background-image: url(${bgImage});
  background-repeat: no-repeat;
  background-size: cover;

  padding: 32px;
  max-width: 560px;
  @media ${QUERIES.tabletAndDown} {
    padding: 24px;

    max-width: calc(808px + 32px);
  }

  transition: none;

  box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.2);

  &:hover {
    box-shadow: 0px 40px 96px rgba(0, 0, 0, 0.45);
  }
`;

const DescriptionWrapper = styled.div`
  padding: 16px;
  background: #3e4047;
  border: 1px solid #4c4e57;
  border-radius: 12px;
`;
