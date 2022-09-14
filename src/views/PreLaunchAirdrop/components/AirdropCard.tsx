import styled from "@emotion/styled";
import React from "react";
import { CheckIconMapping, CheckIconState } from "./CardIcon";
import { ReactComponent as BackgroundVector } from "assets/prelaunch-card-background-vector.svg";
import { CardContent } from ".";

type AirdropCardContentProps = {
  check?: CheckIconState;
  Icon: React.FunctionComponent;
  title: string;
  acxTokenAmount?: string;
  description?: string;
  externalLink?: string;
  contentStackChildren?: React.ReactElement;
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
}) => (
  <Wrapper eligible={check ?? "undetermined"}>
    <WrapperBackground />
    <CardContent
      Icon={Icon}
      check={check}
      title={title}
      description={description}
      acxTokenAmount={acxTokenAmount}
      externalLink={externalLink}
    >
      {contentStackChildren}
    </CardContent>
    <ChildrenWrapper>{children}</ChildrenWrapper>
  </Wrapper>
);

export default AirdropCard;

type WrapperType = {
  eligible: CheckIconState;
};
const Wrapper = styled.div<WrapperType>`
  max-width: 560px;
  width: 100%;
  position: relative;

  border: 1px solid ${({ eligible }) => CheckIconMapping[eligible].color};
  box-shadow: 0px 24px 160px rgba(0, 0, 0, 0.45);
  border-radius: 16px;

  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  overflow: clip;
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
