import styled from "@emotion/styled";
import { ButtonV2 } from "components";
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

  @media ${QUERIESV2.sm.andDown} {
    flex-direction: column;
  }
`;

export const Divider = styled.div`
  width: 100%;
  background: #3e4047;
  height: 1px;
`;

export const Button = styled(ButtonV2)<{ isRemove?: boolean }>`
  width: 100%;
  background-color: ${({ isRemove }) => (isRemove ? `#f9d26c` : `#6cf9d8`)};

  @media ${QUERIESV2.sm.andDown} {
    height: 40px;
    padding: 0px 20px;
    border-radius: 20px;
  }

  &:hover {
    opacity: 1;
  }
`;
