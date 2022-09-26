import styled from "@emotion/styled";
import React from "react";
import { CardIcon, EligibilityPill } from ".";
import { CheckIconState } from "./CardIcon";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-external-link-16.svg";
import { ReactComponent as AcrossLogo } from "assets/across.svg";
import { Link } from "react-router-dom";
import { QUERIESV2 } from "utils";
import { formatNumberMaxFracDigits } from "utils";

type CardContentProps = {
  check?: CheckIconState;
  Icon: React.FunctionComponent;
  title: string;
  description?: string;
  acxTokenAmount?: string;
  externalLink?: string;
};

const CardContent: React.FC<CardContentProps> = ({
  check,
  Icon,
  title,
  description,
  externalLink,
  acxTokenAmount,
  children,
}) => {
  const isPillDisplayed = check && check !== "undetermined";

  return (
    <Wrapper>
      <CardIcon Icon={Icon} checkIconState={check} />
      <TextStack>
        {isPillDisplayed && <EligibilityPill eligible={check === "eligible"} />}
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
        {children}
      </TextStack>
      {externalLink && (
        <ExternalLink to={externalLink}>
          <ExternalLinkIcon />
        </ExternalLink>
      )}
      {acxTokenAmount && (
        <TokenAmountWrapper>
          <TokenAmount>
            {formatNumberMaxFracDigits(Number(acxTokenAmount))} $ACX
          </TokenAmount>
          <AcrossLogo />
        </TokenAmountWrapper>
      )}
    </Wrapper>
  );
};

export default CardContent;

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 24px;

  background: transparent;

  & * {
    z-index: 1;
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

const Title = styled.p`
  font-size: 22px;
  line-height: 26px;

  @media ${QUERIESV2.tb.andDown} {
    font-size: 18px;
  }
`;

const Description = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;

  @media ${QUERIESV2.tb.andDown} {
    font-size: 14px;
  }
`;

const ExternalLink = styled(Link)`
  height: 40px;
  width: 40px;
`;

const TokenAmountWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  gap: 8px;
  height: 48px;
  min-width: 145px;
  background: #2d2e33;

  border: 1px solid #3e4047;
  border-radius: 8px;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const TokenAmount = styled.h3`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #6cf9d8;
`;
