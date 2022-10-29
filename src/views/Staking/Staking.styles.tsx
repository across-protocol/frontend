import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  background-color: transparent;

  max-width: 600px;
  width: calc(100% - 24px);

  margin: 64px auto 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media ${QUERIESV2.sm.andDown} {
    margin: 16px auto;
    gap: 16px;
  }
`;

export const Card = styled.div`
  width: 100%;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  background: #34353b;

  border: 1px solid #3e4047;
  border-radius: 10px;

  flex-wrap: nowrap;

  padding: 24px;
  gap: 24px;
  @media ${QUERIESV2.sm.andDown} {
    padding: 12px 16px 16px;
    gap: 16px;
    margin-top: -4px;
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
