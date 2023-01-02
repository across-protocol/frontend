import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Container = styled.div`
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

export const StatsRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 24px;
`;
