import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Wrapper = styled.div`
  margin: 0px 0px 24px 23px;
  display: flex;
  align-items: center;
  justify-content: start;

  @media (max-width: 576px) {
    margin: 0px 0px 16px 19px;
    width: 404px;
  }
`;

export const ExitIcon = styled(FontAwesomeIcon)`
  color: #9daab2;
  font-size: 16px;
  @media (max-width: 576px) {
    font-size: 17px;
  }
`;

export const StylizedLink = styled(Link)``;

export const Logo = styled.img`
  height: 32px;
  width: 32px;

  margin: 0px 12px 0px 21px;
  @media (max-width: 576px) {
    margin: 0px 8px 0px 18px;
    height: 24px;
    width: 24px;
  }
`;

export const Text = styled.p`
  font-family: "Barlow";
  font-style: "normal";
  font-weight: 400;
  line-height: 26px;
  color: #e0f3ff;

  font-size: 22px;
  @media (max-width: 576px) {
    font-size: 18px;
  }
`;
