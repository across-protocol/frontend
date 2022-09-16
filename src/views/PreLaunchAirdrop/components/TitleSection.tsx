import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-right-16.svg";
import { ButtonV2 } from "components";
import React from "react";
import { QUERIES } from "utils";
import { ReactComponent as AcrossRingLogo } from "assets/across-logo-with-rings.svg";

type TitleSectionProps = {
  isConnected?: boolean;
};
const TitleSection = ({ isConnected }: TitleSectionProps) => {
  return (
    <Wrapper>
      <AcrossRingLogo />
      <TextStack>
        <PageHeader>ACX is about to launch.</PageHeader>
        <PageSubHeader>
          The token launch is almost here and as a community member you will
          have the opportunity to make your claim for a piece of the official
          airdrop.
        </PageSubHeader>
      </TextStack>
      <ButtonStack>
        {!isConnected && (
          <StyledButton size="lg">Connect to check eligibility</StyledButton>
        )}
        <EligibilityLink to={"/"}>
          <InnerLinkText>Airdrop details</InnerLinkText>
          <StyledArrowIcon />
        </EligibilityLink>
      </ButtonStack>
    </Wrapper>
  );
};
export default React.memo(TitleSection);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  text-align: center;

  width: calc(100% - 24px);

  @media ${QUERIES.tabletAndUp} {
    max-width: calc(560px + 24px);
  }
`;

const PageHeader = styled.h1`
  font-size: 48px;
  line-height: 58px;
  font-weight: 400;
  font-style: normal;
  letter-spacing: -0.02em;
  color: #e0f3ff;
  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%),
    linear-gradient(0deg, #e0f3ff, #e0f3ff);
  background-clip: text;
  -webkit-text-fill-color: transparent;

  @media ${QUERIES.mobileAndDown} {
    font-size: 32px;
  }
`;

const ButtonStack = styled.div`
  display: flex;

  gap: 32px;

  flex-direction: row;
  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    gap: 24px;
  }
`;

const TextStack = styled.div`
  display: flex;
  flex-direction: column;

  gap: 16px;
`;

const PageSubHeader = styled.h2`
  color: #c5d5e0;
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;

  @media ${QUERIES.mobileAndDown} {
    font-size: 16px;
    font-weight: 500;
  }
`;

const EligibilityLink = styled(Link)`
  font-weight: 500;
  font-size: 18px;
  line-height: 26px;
  color: #e0f3ff;
  text-decoration: none;

  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

const InnerLinkText = styled.span``;

const StyledArrowIcon = styled(ArrowIcon)`
  color: #e0f3ff;
  & * {
    stroke: #e0f3ff;
  }
`;

const StyledButton = styled(ButtonV2)`
  width: 293px;
  height: 64px;

  background: linear-gradient(264.97deg, #6cf9d8 24.16%, #c4fff1 61.61%);
  box-shadow: 0px 0px 24px rgba(109, 250, 217, 0.25);
  border-radius: 32px;
  padding: 0px 40px;
`;
