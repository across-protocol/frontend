import styled from "@emotion/styled";
import { ReactComponent as UmaLogo } from "assets/icons/powered-by-logo.svg";

export const Wrapper = styled.div`
  padding: 25px 16px;
  display: flex;
  justify-content: space-between;
  color: #9daab2;

  @media (max-width: 428px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const LinksContainer = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 428px) {
    margin: 0 0 24px;
  }
`;

export const Link = styled.a`
  display: flex;
  margin: 0 16px;
  font-size: ${16 / 16}rem;
  line-height: ${20 / 16}rem;
  font-weight: 500;
  text-decoration: none;
  color: #9daab2;

  :hover {
    color: #e0f3ff;

    svg path {
      fill: #e0f3ff;
    }
  }

  @media (max-width: 428px) {
    font-size: ${14 / 16}rem;
    line-height: ${18 / 16}rem;
  }
`;

export const AccentLink = styled(Link)`
  color: #9daab2;

  :hover {
    svg path {
      fill: var(--color-uma-red);
    }
  }
`;

export const FooterLogo = styled(UmaLogo)`
  @media (max-width: 428px) {
    height: 18px;
  }
`;
