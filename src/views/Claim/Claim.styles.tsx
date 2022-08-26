import styled from "@emotion/styled";

import { ButtonV2 } from "components";
import { QUERIESV2 } from "utils/constants";

export const PageContainer = styled.div`
  background-color: #2d2e33;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100vh - 72px);
  @media (max-width: 428px) {
    min-height: calc(100vh - 64px);
  }
`;

export const BodyContainer = styled.div`
  color: #e0f3ff;

  max-width: 600px;
  width: 100%;
  margin: 64px auto;

  @media (max-width: 630px) {
    padding-left: 16px;
    padding-right: 16px;
  }

  @media ${QUERIESV2.sm} {
    margin: 48px auto;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p {
    font-style: normal;
    font-weight: 400;
  }

  h1 {
    font-size: ${26 / 16}rem;
    line-height: ${31 / 16}rem;

    @media ${QUERIESV2.sm} {
      font-size: ${22 / 16}rem;
      line-height: ${26 / 16}rem;
    }
  }

  h2 {
    font-size: ${22 / 16}rem;
    line-height: ${26 / 16}rem;

    @media ${QUERIESV2.sm} {
      font-size: ${18 / 16}rem;
      line-height: ${26 / 16}rem;
    }
  }

  h6 {
    font-size: ${18 / 16}rem;
    line-height: ${26 / 16}rem;

    @media ${QUERIESV2.sm} {
      font-size: ${16 / 16}rem;
      line-height: ${20 / 16}rem;
    }
  }

  p {
    @media ${QUERIESV2.sm} {
      font-size: ${14 / 16}rem;
      line-height: ${18 / 16}rem;
    }
  }

  a {
    :hover {
      cursor: pointer;
    }

    :visited {
      color: inherit;
    }
  }
`;

export const Title = styled.h2`
  padding-left: 16px;
  padding-bottom: 24px;

  @media ${QUERIESV2.sm} {
    padding-bottom: 12px;
  }
`;

export const Button = styled(ButtonV2)`
  @media ${QUERIESV2.sm} {
    font-size: ${16 / 16}rem;
    line-height: ${20 / 16}rem;
    padding: 10px 20px;
  }
`;

export const FullWidthButton = styled(Button)`
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 100%;
`;
