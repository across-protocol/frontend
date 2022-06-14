import styled from "@emotion/styled";
import { ReactComponent as GithubLogo } from "assets/github-logo.svg";
import { SecondaryButtonWithoutShadow } from "components/Buttons";
import { QUERIES } from "utils";

export const Wrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 1rem auto 1.5rem;
  background-color: var(--color-primary);
  padding: 1.5rem 2rem;
  @media ${QUERIES.tabletAndDown} {
    margin-bottom: 1rem;
    width: 95%;
  }
`;

export const GiftIcon = styled(GithubLogo)`
  height: 32px;
  width: 32px;
  path {
    fill: var(--color-gray);
  }
`;

export const Header = styled.h2`
  color: var(--color-gray);
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1rem;
`;

export const SubHeader = styled.h3`
  color: var(--color-gray);
  font-size: 1rem;
  margin-top: 1rem;
  font-weight: 400;
`;

export const HeroButton = styled(SecondaryButtonWithoutShadow)`
  background-color: #2d2e33;
  color: var(--color-primary);
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  &:hover {
    color: var(--color-white);
  }
`;
