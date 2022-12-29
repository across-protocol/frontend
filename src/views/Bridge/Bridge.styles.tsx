import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import ExternalCardWrapper from "components/CardWrapper";

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

export const CardWrapper = styled(ExternalCardWrapper)`
  width: 100%;
`;

export const RowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 12px;

  width: 100%;
`;

export const ChainIconTextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  padding: 0px;
  gap: 12px;
`;

export const ChainIcon = styled.img`
  width: 24px;
  height: 24px;
`;
