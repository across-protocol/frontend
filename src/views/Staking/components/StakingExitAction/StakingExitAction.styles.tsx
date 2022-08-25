import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { QUERIESV2 } from "utils";
import { ReactComponent as ChevronLeft } from "assets/icons/chevron-left-vector.svg";

export const Wrapper = styled(Link)`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;

  padding: 0px 16px;
  width: fit-content;

  text-decoration: none;
`;

export const ExitIcon = styled(ChevronLeft)`
  height: 24px;
  width: 24px;
`;

export const Logo = styled.img`
  height: 32px;
  width: 32px;

  @media ${QUERIESV2.sm} {
    height: 24px;
    width: 24px;
  }
`;

export const Text = styled.span`
  color: #e0f3ff;

  font-size: 22px;
  @media ${QUERIESV2.sm} {
    font-size: 18px;
  }
`;

export const TitleLogo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;
