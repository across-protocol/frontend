import styled from "@emotion/styled";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as UnstyledUmaLogo } from "assets/Across-Powered-UMA.svg";
export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 1.5rem;
  margin-top: 10vh;
  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    flex-wrap: wrap;
  }
`;
const BaseFooter = styled.footer`
  position: sticky;
  bottom: 0;
  padding: 0 15px 15px;
  align-self: self-end;
  justify-self: center;
  @media ${QUERIES.laptopAndUp} {
    justify-self: start;
  }
`;

export const LinkFooter = styled(BaseFooter)`
  display: none;
  align-items: center;
  & svg {
    width: 25px;
    height: 25px;
  }
  @media ${QUERIES.laptopAndUp} {
    display: flex;
  }
`;

export const LogoFooter = styled(BaseFooter)`
  position: absolute;
  right: 10px;
  display: none;
  @media ${QUERIES.tabletAndUp} {
    display: block;
    position: sticky;
    right: revert;
    margin-left: auto;
  }
`;

export const Link = styled.a`
  text-decoration: none;
  transition: color 100ms linear;
  color: hsla(${COLORS.white} / 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: ${14 / 16}rem;
  opacity: 0.75;
  align-items: center;

  > svg {
    height: 20px;
    path {
      fill: var(--color-white);
    }
  }
  &:not(:last-of-type) {
    margin-right: 45px;
  }

  &:hover {
    color: var(--color-white);
    opacity: 1;
  }
`;

export const AccentLink = styled(Link)`
  &:hover {
    color: var(--color-uma-red);
  }
`;

export const PoweredByUMA = styled(UnstyledUmaLogo)`
  fill: currentColor;
  transition: fill linear 100ms;
  & path {
    fill: currentColor;
  }
`;

export const LinkText = styled.div`
  color: var(--color-white);
`;
