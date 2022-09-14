import styled from "@emotion/styled";
import React from "react";
import { Link } from "react-router-dom";

type buttonAttrib = {
  text: string;
  link: string;
};
type AirdropButtonGroupProps = {
  left: buttonAttrib;
  right?: buttonAttrib;
};

const AirdropButtonGroup: React.FC<AirdropButtonGroupProps> = ({
  left,
  right,
}) => (
  <Wrapper>
    <StyledLink to={left.link}>{left.text}</StyledLink>
    {right && <StyledLinkAlt to={right.link}>{right.text}</StyledLinkAlt>}
  </Wrapper>
);

export default AirdropButtonGroup;

const StyledLink = styled(Link)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0px;
  gap: 6px;

  width: 176px;
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
