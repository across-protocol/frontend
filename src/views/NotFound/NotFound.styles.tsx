import styled from "@emotion/styled";
import { Link as UnstyledLink } from "react-router-dom";
import { ReactComponent as EmptyCloud } from "assets/across-emptystate-clouds.svg";

export const Wrapper = styled.div`
  background-color: #2d2e33;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1000px;
  width: calc(100% - 32px);
  margin: 0 auto;
  align-items: center;
  padding-top: 4rem;
`;

export const Title = styled.h1`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: ${32 / 16}rem;
`;
export const Body = styled.div`
  color: #fff;
  padding: 0.5rem 1rem;
  font-size: ${20 / 16}rem;
`;

export const Link = styled(UnstyledLink)`
  color: var(--color-primary);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const CloudWrapper = styled.div``;
export const StyledEmptyCloud = styled(EmptyCloud)``;
