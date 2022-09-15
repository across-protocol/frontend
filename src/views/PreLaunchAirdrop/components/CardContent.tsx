import styled from "@emotion/styled";
import React from "react";
import { CardIcon, EligibilityPill } from ".";
import { CheckIconState } from "./CardIcon";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-external-link-16.svg";
import { ReactComponent as AcrossLogo } from "assets/across.svg";
import { Link } from "react-router-dom";

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
        {acxTokenAmount && (
          <TokenAmountWrapper>
            <StyledAcrossLogo /> {acxTokenAmount} $ACX
          </TokenAmountWrapper>
        )}
        {description && <Description>{description}</Description>}
        {children}
      </TextStack>
      {externalLink && (
        <ExternalLink to={externalLink}>
          <ExternalLinkIcon />
        </ExternalLink>
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
  gap: 12px;
  width: 100%;
`;

const Title = styled.p`
  font-size: 22px;
  line-height: 26px;
`;

const Description = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
`;

const ExternalLink = styled(Link)`
  height: 40px;
  width: 40px;
`;

const TokenAmountWrapper = styled.div`
  margin-top: -4px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;

  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #6cf9d8;
`;

const StyledAcrossLogo = styled(AcrossLogo)`
  height: 16px;
  width: 16px;
`;
