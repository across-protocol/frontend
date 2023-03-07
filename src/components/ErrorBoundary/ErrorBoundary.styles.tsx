import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;

  background-color: "#2d2e33";
`;

export const InnerWrapper = styled.div`
  background-color: transparent;

  margin: 0px auto 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  height: 100%;

  padding: 0px 24px;
  @media ${QUERIESV2.sm.andDown} {
    margin: 0px auto;
    padding: 0px 12px;
  }
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 8px;
  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
  }
`;
