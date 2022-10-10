import styled from "@emotion/styled";

export const Wrapper = styled.div`
  background-color: #2d2e33;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100% - 72px);

  @media (max-width: 428px) {
    min-height: calc(100% - 64px);
  }
`;

export const Content = styled.div`
  width: 100%;
  max-width: 1140px;
  padding: ${64 / 16}rem ${40 / 16}rem;
  margin: 0 auto;

  display: flex;
  align-items: center;
  flex-direction: column;

  @media screen and (max-width: 1024px) {
    padding: ${44 / 16}rem ${24 / 16}rem ${48 / 16}rem;
  }

  @media screen and (max-width: 428px) {
    padding: ${36 / 16}rem ${12 / 16}rem ${48 / 16}rem;
  }
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
