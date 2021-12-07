import styled from "@emotion/styled";
import { BaseButton, PrimaryButton } from "../Buttons";

export const RemoveFormButton = styled(PrimaryButton)`
  margin-top: 32px;
  width: 90%;
  background: var(--color-primary);
  color: var(--color-gray);
  font-size: ${18 / 16}rem;
  line-height: 1.1;
  padding: 16px 8px;
  margin-left: 24px;
  margin-right: 24px;
`;

export const RemoveFormButtonWrapper = styled.div`
  background: linear-gradient(180deg, #334243 0%, rgba(51, 66, 67, 0) 100%);
  margin: 16px -16px 0;
`;

export const RemoveAmount = styled.div`
  font-size: ${20 / 16}rem;
  color: var(--color-white);
  font-weight: 700;
  padding-bottom: 32px;
  padding-left: 8px;
  span {
    color: var(--color-primary);
  }
`;

export const RemovePercentButtonsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  margin-bottom: 16px;
`;

export const RemovePercentButton = styled(BaseButton)`
  flex-basis: 20%;
  justify-content: space-evenly;
  background-color: var(--color-white);
  color: var(--color-gray);
  font-size: ${14 / 16}rem;
  height: ${40 / 16}rem;
  padding: 0.5rem;
  font-weight: 500;
  border-radius: ${32 / 16}rem;
  &:hover {
    background-color: #6cf9d8;
  }
`;

export const Balance = styled.div`
  display: flex;
  justify-content: flex-end;
  span {
    color: var(--color-primary);
    font-size: ${12 / 16}rem;
    line-height: 1rem;
    margin-right: 24px;
    margin-top: 12px;
  }
`;

export const FeesBlockWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
`;

export const FeesBlock = styled.div`
  color: var(--color-white);
`;

export const FeesPercent = styled.span`
  color: var(--color-white);
  font-weight: 400;
`;

export const FeesBoldInfo = styled.div`
  font-size: ${16 / 16}rem;
  font-weight: 700;
`;

export const FeesInfo = styled.div`
  color: var(--color-transparent-white);
  font-weight: 400;
`;

export const FeesValues = styled.div`
  text-align: right;
  font-size: ${14 / 16}rem;
  font-weight: 400;
  color: var(--color-transparent-white);
  &:first-of-type {
    font-weight: 700;
    font-size: ${16 / 16}rem;
    color: var(--color-white);
  }
`;
