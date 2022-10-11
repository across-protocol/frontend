import styled from "@emotion/styled";
import { ButtonV2 } from "components";
import React from "react";

type ButtonProps = {
  text: string;
  handler: () => void;
};
type AirdropButtonGroupProps = {
  left: ButtonProps;
  right?: ButtonProps;
};

const AirdropButtonGroup: React.FC<AirdropButtonGroupProps> = ({
  left,
  right,
}) => {
  return (
    <Wrapper>
      <StyledLink size="lg" onClick={() => left.handler()}>
        {left.text}
      </StyledLink>
      {right && (
        <StyledLinkAlt size="lg" onClick={() => right.handler()}>
          {right.text}
        </StyledLinkAlt>
      )}
    </Wrapper>
  );
};

export default AirdropButtonGroup;

const StyledLink = styled(ButtonV2)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px;
  gap: 6px;

  min-width: 176px;
  width: fit-content;
  height: 40px;

  background: #2d2e33;

  border: 1px solid #6cf9d8;
  border-radius: 20px;

  font-weight: 500;
  font-size: 16px;
  line-height: 20px;

  color: #6cf9d8;
  text-decoration: none;
`;

const StyledLinkAlt = styled(StyledLink)`
  color: #e0f3ff;
  border-color: #4c4e57; ;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding-top: 12px;
`;
