import styled from "@emotion/styled";
import React from "react";

type CardIconProps = {};

const CardTextDescription: React.FC<CardIconProps> = ({ children }) => (
  <Wrapper>{children}</Wrapper>
);

export default CardTextDescription;

const Wrapper = styled.div`
  padding: 16px;

  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #c5d5e0;
  background: #3e4047;
  border: 1px solid #4c4e57;
  border-radius: 12px;
`;
