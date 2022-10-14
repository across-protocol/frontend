import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;

  max-width: calc(1140px + 48px);
  width: calc(100% - 48px);

  margin: 0 auto;
  padding: 32px 0;

  @media ${QUERIESV2.sm.andDown} {
    max-width: calc(1140px + 24px);
    width: calc(100% - 24px);
  }
`;

export const InnerSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 64px;

  width: 100%;
`;
