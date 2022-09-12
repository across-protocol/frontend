import styled from "@emotion/styled";
import React from "react";
import { CardIcon, EligibilityPill } from ".";
import { CheckIconState } from "./CardIcon";
import { ReactComponent as ExternalLinkIcon } from "assets/icons/arrow-external-link-16.svg";
import { Link } from "react-router-dom";

type CardContentProps = {
  check?: CheckIconState;
  Icon: React.FunctionComponent;
  title: string;
  description: string;
  externalLink?: string;
};

const CardContent = ({
  check,
  Icon,
  title,
  description,
  externalLink,
}: CardContentProps) => {
  const isPillDisplayed = check && check !== "undetermined";

  return (
    <Wrapper>
      <CardIcon Icon={Icon} checkIconState={check} />
      <TextStack>
        {isPillDisplayed && <EligibilityPill eligible={check === "eligible"} />}
        <Title>{title}</Title>
        <Description>{description}</Description>
      </TextStack>
      {externalLink && (
        <ExternalLink to={externalLink}>
          <ExternalLinkIcon />
        </ExternalLink>
      )}
    </Wrapper>
  );
};

export default React.memo(CardContent);

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 32px;
  gap: 24px;

  border-bottom: 1px solid #3e4047;
  background: #2d2e33;

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
