import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const OuterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Subtract to account for header */
  min-height: calc(100vh - 72px);
  @media ${QUERIESV2.sm.andDown} {
    /* Subtract to account for header */
    min-height: calc(100vh - 64px);
  } ;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  max-width: calc(1140px);
  width: calc(100%);

  margin: 0 auto;
  padding: 32px 0;

  @media ${QUERIESV2.sm.andDown} {
    padding: 16px 0;
    gap: 16px;
  }
`;

export const InnerSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 64px;

  width: 100%;

  @media ${QUERIESV2.sm.andDown} {
    gap: 24px;
  }
`;
