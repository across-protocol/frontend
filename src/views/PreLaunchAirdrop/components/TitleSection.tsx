import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { ReactComponent as ArrowIcon } from "assets/icons/arrow-right-16.svg";
import React from "react";

const TitleSection = () => {
  return (
    <Wrapper>
      <PageHeader>ACX is about to launch.</PageHeader>
      <PageSubHeader>
        The token launch is almost here and as a community member you will have
        the opportunity to make your claim for a piece of the official airdrop.
      </PageSubHeader>
      <EligibilityLink to={"/"}>
        <InnerLinkText>Read about airdrop eligibility</InnerLinkText>
        <StyledArrowIcon />
      </EligibilityLink>
    </Wrapper>
  );
};
export default React.memo(TitleSection);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 560px;
  width: 100%;
  text-align: center;
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
`;

const PageSubHeader = styled.h2`
  color: #c5d5e0;
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 26px;
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
