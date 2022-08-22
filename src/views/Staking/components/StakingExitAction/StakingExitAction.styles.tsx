import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  margin: 0px 0px 24px 23px;
  display: flex;
  align-items: center;
  justify-content: start;

  @media ${QUERIESV2.sm} {
    margin: 0px 0px 17px 19px;
  }
`;

export const ExitIcon = styled(FontAwesomeIcon)`
  color: #9daab2;
  font-size: 16px;
  @media ${QUERIESV2.sm} {
    font-size: 17px;
  }
`;

export const StylizedLink = styled(Link)``;

export const Logo = styled.img`
  height: 32px;
  width: 32px;

  margin: 0px 12px 0px 18px;
  @media ${QUERIESV2.sm} {
    margin-right: 8px;
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
  @media ${QUERIESV2.sm} {
    font-size: 18px;
  }
`;
