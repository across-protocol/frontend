import styled from "@emotion/styled";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as UnstyledUmaLogo } from "assets/Across-Powered-UMA.svg";
export const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 1.5rem;
  margin-top: 10vh;
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
    align-content: center;
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
  gap: 14px;
  font-size: ${16 / 16}rem;
  opacity: 0.75;
  align-items: center;

  > svg {
    margin-bottom: -12px;
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
  @media ${QUERIES.tabletAndDown} {
    margin-bottom: 0;
    > svg {
      height: 24px;
      width: 24px;
    }
    &:not(:last-of-type) {
      margin-right: 0px;
    }
    margin: 0 30px;
  }
`;

export const AccentLink = styled(Link)`
  &:hover {
    color: var(--color-uma-red);
  }
  @media ${QUERIES.tabletAndDown} {
    svg {
      height: 40px;
      width: 100px;
    }
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

export const MobileWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
`;

export const MobileLinkRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

export const MobileAccentRow = styled.div``;
