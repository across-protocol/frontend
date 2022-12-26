import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  background-color: transparent;

  width: 100%;

  margin: 48px auto 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media ${QUERIESV2.sm.andDown} {
    margin: 16px auto;
    gap: 16px;
  }
`;

export const RowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;
`;
