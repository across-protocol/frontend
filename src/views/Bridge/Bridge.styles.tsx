import styled from "@emotion/styled";
import { QUERIESV2 } from "utils";
import ExternalCardWrapper from "components/CardWrapper";
import { SecondaryButtonWithoutShadow as UnstyledButton } from "components/Buttons";
import { Text } from "components";

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

  position: relative;
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

export const QuickSwapWrapper = styled.div`
  height: fit-content;
  width: fit-content;
  position: absolute;
  left: calc(50% - 20px);
  top: -25px;
`;

export const FromSelectionStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
`;

export const ChangeAddressLink = styled(Text)`
  cursor: pointer;
`;

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #3e4047;
`;

export const Button = styled(UnstyledButton)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  background: #6cf9d8;
  border-radius: 32px;
  height: 64px;
  width: 100%;
`;
