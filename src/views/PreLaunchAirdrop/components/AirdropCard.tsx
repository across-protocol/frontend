import styled from "@emotion/styled";
import React from "react";
import { CheckIconMapping, CheckIconState } from "./CardIcon";
import { ReactComponent as BackgroundVector } from "assets/prelaunch-card-background-vector.svg";
import { CardContent } from ".";
import { QUERIES } from "utils";

type AirdropCardContentProps = {
  check?: CheckIconState;
  Icon: React.FunctionComponent;
  title: string;
  acxTokenAmount?: string;
  description?: string;
  externalLink?: string;
  contentStackChildren?: React.ReactElement;
  hideBoxShadow?: boolean;
  boxShadowOnHover?: boolean;
  rewardAmount?: string;
  // Internal React-router link, eg: /pools
  buttonLink?: string;
};

const AirdropCard: React.FC<AirdropCardContentProps> = ({
  check,
  Icon,
  title,
  description,
  externalLink,
  acxTokenAmount,
  children,
  contentStackChildren,
  hideBoxShadow,
  rewardAmount,
  buttonLink,
  boxShadowOnHover,
}) => (
  <Wrapper
    eligible={check ?? "undetermined"}
    boxShadowOnHover={boxShadowOnHover}
    hideBoxShadow={hideBoxShadow}
  >
    <WrapperBackground />
    <CardContent
      Icon={Icon}
      check={check}
      title={title}
      description={description}
      acxTokenAmount={acxTokenAmount}
      externalLink={externalLink}
      rewardAmount={rewardAmount}
      buttonLink={buttonLink}
    >
      {contentStackChildren}
    </CardContent>
    {children && <ChildrenWrapper>{children}</ChildrenWrapper>}
  </Wrapper>
);

export default AirdropCard;

type WrapperType = {
  eligible: CheckIconState;
  hideBoxShadow?: boolean;
  boxShadowOnHover?: boolean;
};
const Wrapper = styled.div<WrapperType>`
  width: 100%;
  position: relative;

  border: 1px solid ${({ eligible }) => CheckIconMapping[eligible].color};

  border-radius: 16px;

  display: flex;
  flex-direction: column;
  gap: 32px;

  overflow: clip;

  background-color: #2d2e33;

  padding: 32px;
  max-width: 560px;
  @media ${QUERIES.tabletAndDown} {
    padding: 24px;

    max-width: calc(808px + 32px);
  }

  transition: ${({ boxShadowOnHover }) =>
    boxShadowOnHover ? "box-shadow 250ms" : "none"};

  box-shadow: ${({ hideBoxShadow, boxShadowOnHover }) =>
    hideBoxShadow || boxShadowOnHover
      ? "0px 16px 32px rgba(0, 0, 0, 0.2) "
      : "0px 24px 160px rgba(0, 0, 0, 0.45) "};

  &:hover {
    box-shadow: ${({ hideBoxShadow, boxShadowOnHover }) =>
      hideBoxShadow || boxShadowOnHover
        ? "0px 40px 96px rgba(0, 0, 0, 0.45)"
        : "0px 24px 160px rgba(0, 0, 0, 0.45)"};
  }
`;

const ChildrenWrapper = styled.div`
  z-index: 1;
  isolation: isolate;
  position: relative;
`;

const WrapperBackground = styled(BackgroundVector)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
`;
