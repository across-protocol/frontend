import styled from "@emotion/styled";
import React from "react";

import { ReactComponent as AcrossLogo } from "assets/across.svg";
import { QUERIESV2 } from "utils";
import { Text } from "components/Text";

type Props = {
  Icon: React.ReactElement;
  title: string;
  acxTokenAmount: string;
};

const InfoCardTop = ({ Icon, title, acxTokenAmount }: Props) => {
  return (
    <Wrapper>
      {Icon}
      <TextStack>
        <Text size="xl" color="white-100">
          {title}
        </Text>
        <TokenAmountWrapper>
          <StyledAcrossLogo />
          <Text color="aqua">{acxTokenAmount} $ACX</Text>
        </TokenAmountWrapper>
      </TextStack>
    </Wrapper>
  );
};

export default InfoCardTop;

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  justify-content: space-between;
  gap: 24px;

  background: transparent;

  position: relative;

  & * {
    z-index: 1;
  }
  @media screen and (max-width: 624px) {
    flex-direction: column;
  }

  a {
    text-decoration: none;
  }

  > svg:first-child {
    height: 56px;
    width: 56px;
  }
`;

const TextStack = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  gap: 12px;
  @media ${QUERIESV2.tb.andDown} {
    gap: 8px;
  }
`;

const TokenAmountWrapper = styled.div`
  margin-top: -4px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
`;

const StyledAcrossLogo = styled(AcrossLogo)`
  height: 16px;
  width: 16px;
`;
