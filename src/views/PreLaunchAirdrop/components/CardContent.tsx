import styled from "@emotion/styled";
import React from "react";
import { CardIcon, EligibilityPill } from ".";
import { CheckIconState } from "./CardIcon";
import { ReactComponent as AcrossLogo } from "assets/across.svg";
import { QUERIESV2 } from "utils";
import { SecondaryButtonV2 as UnstyledPoolButton } from "components/Buttons/ButtonV2";
import { Link } from "react-router-dom";

type CardContentProps = {
  check?: CheckIconState;
  Icon: React.FunctionComponent;
  title: string;
  description?: string;
  acxTokenAmount?: string;
  externalLink?: string;
  rewardAmount?: string;
  // Internal React-router link, eg: /pools
  buttonLink?: string;
};

const CardContent: React.FC<CardContentProps> = ({
  check,
  Icon,
  title,
  description,
  acxTokenAmount,
  rewardAmount,
  children,
  buttonLink,
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
        {acxTokenAmount && (
          <TokenAmountWrapper>
            <StyledAcrossLogo /> {acxTokenAmount} $ACX
          </TokenAmountWrapper>
        )}
      </TextStack>
      {rewardAmount && (
        <RewardAmountWrapper>
          <RewardAmount>{rewardAmount} $ACX</RewardAmount>
          <AcrossLogo />
        </RewardAmountWrapper>
      )}
      {buttonLink && (
        <Link to={buttonLink}>
          <PoolLinkButton size="md">Go to Pools</PoolLinkButton>
        </Link>
      )}
    </Wrapper>
  );
};

export default CardContent;

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

const RewardAmountWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  gap: 8px;
  height: 40px;
  background: #2d2e33;
  width: fit-content;
  flex-shrink: 0;
  border: 1px solid #3e4047;
  border-radius: 8px;
  svg {
    flex-shrink: 0;

    width: 16px;
    height: 16px;
  }

  position: absolute;
  right: 0;
  top: 0;
`;

const RewardAmount = styled.h3`
  font-family: "Barlow";
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
  color: #6cf9d8;
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

const PoolLinkButton = styled(UnstyledPoolButton)`
  display: none;
  @media ${QUERIESV2.tb.andDown} {
    display: block;
  }
`;
