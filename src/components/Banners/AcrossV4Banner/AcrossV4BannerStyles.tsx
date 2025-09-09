import styled from "@emotion/styled";
import { ExternalLink } from "components/ExternalLink";
import { COLORS, QUERIES } from "utils";
import { ReactComponent as AcrossLogo } from "assets/icons/across-logo.svg";

export const StyledWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background-color: ${COLORS["aqua"]};
  color: ${COLORS["black-800"]};
  height: 56px;

  @media ${QUERIES.tabletAndDown} {
    flex-direction: column;
    height: 72px;
    gap: 4px;
  }

  span {
    font-weight: 500;
    text-transform: uppercase;
    font-size: 1.2em;
  }

  div {
    gap: 4px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
`;

export const Link = styled(ExternalLink)`
  color: ${COLORS["black-800"]};
  font-size: 1em;
`;

export const Logo = styled(AcrossLogo)`
  width: 18px;
  height: 18px;
  color: inherit;
  margin-right: 6px;
`;
