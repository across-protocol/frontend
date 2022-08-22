import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const INTERNAL_BREAKPOINT = "(max-width: 576px)";

export const Wrapper = styled.div`
  margin: 0px 0px 24px 23px;
  display: flex;
  align-items: center;
  justify-content: start;

  @media ${INTERNAL_BREAKPOINT} {
    margin: 0px 0px 17px 19px;
  }
`;

export const ExitIcon = styled(FontAwesomeIcon)`
  color: #9daab2;
  font-size: 16px;
  @media ${INTERNAL_BREAKPOINT} {
    font-size: 17px;
  }
`;

export const StylizedLink = styled(Link)``;

export const Logo = styled.img`
  height: 32px;
  width: 32px;

  margin: 0px 12px 0px 18px;
  @media ${INTERNAL_BREAKPOINT} {
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
  @media ${INTERNAL_BREAKPOINT} {
    font-size: 18px;
  }
`;
