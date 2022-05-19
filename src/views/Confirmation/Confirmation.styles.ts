import styled from "@emotion/styled";
import {
  PrimaryButton,
  SectionTitle,
  Section,
  AccentSection,
} from "components";
import { QUERIES } from "utils";
import { Link as UnstyledLink } from "react-router-dom";

export const Wrapper = styled.div`
  padding-top: 50px;
`;

export const Header = styled(Section)`
  display: grid;
  place-items: center;
  border-bottom: none;
`;

export const Heading = styled(SectionTitle)`
  font-weight: 700;
  font-size: ${30 / 16}rem;
`;

export const SubHeading = styled(SectionTitle)`
  font-weight: 100;
  margin-bottom: 20px;
`;

export const SuccessIcon = styled.div`
  background-color: var(--color-primary);
  color: var(--color-gray);
  border-radius: 9999px;
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
`;

export const Link = styled.a`
  color: var(--color-primary);
  cursor: pointer;
  display: block;
  width: fit-content;
  margin: auto;
  transition: opacity 100ms linear;
  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
`;

export const SecondaryLink = styled(Link)`
  color: inherit;
  & > span:first-of-type {
    display: none;
    @media ${QUERIES.tabletAndUp} {
      display: revert;
    }
  }
  & > span {
    @media ${QUERIES.tabletAndUp} {
      display: none;
    }
  }
`;

export const InfoSection = styled(AccentSection)`
  --horizontalPadding: 25px;
  padding: 30px var(--horizontalPadding);
  border-top: none;
  @media ${QUERIES.tabletAndUp} {
    --horizontalPadding: 40px;
  }
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const Info = styled.article`
  border-bottom: 1px solid var(--color-primary-dark);
  margin: 0 calc(-1 * var(--horizontalPadding));
  padding: 15px var(--horizontalPadding);

  & > h3 {
    line-height: 1;
  }

  & > div {
    display: flex;
    align-items: center;
    margin-top: 10px;
  }
`;

export const Button = styled(PrimaryButton)`
  width: 100%;
  margin-top: 24px;
`;

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 99px;
  margin-right: 10px;
`;

export const RouterLink = styled(UnstyledLink)`
  color: var(--color-primary);
  cursor: pointer;
  display: block;
  width: fit-content;
  margin: auto;
  transition: opacity 100ms linear;
  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
`;
