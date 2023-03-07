import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  background-color: transparent;

  width: 100%;

  margin: 48px auto 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media ${QUERIESV2.sm.andDown} {
    margin: 16px auto;
    gap: 16px;
  }
`;

export const Divider = styled.div`
  width: 100%;
  height: 1px;

  background: #3e4047;

  flex: none;
  order: 0;
  align-self: stretch;
  flex-grow: 0;
`;
