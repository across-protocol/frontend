import styled from "@emotion/styled";
import {
  BaseButton,
  PrimaryButton,
  SecondaryButtonWithoutShadow,
} from "../Buttons";
import { RoundBox as UnstyledBox, ErrorBox } from "../Box";

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
  opacity: ${(props) => {
    return props.disabled ? "0.25" : "1";
  }};
`;

export const RemoveFormButtonWrapper = styled.div`
  background: linear-gradient(180deg, #334243 0%, rgba(51, 66, 67, 0) 100%);
  margin: 16px -16px 0;
  padding-top: 1.5rem;
`;

export const RemoveAmount = styled.div`
  font-size: ${20 / 16}rem;
  color: var(--color-white);
  font-weight: 700;
  padding-bottom: 32px;
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
  padding: 8px 0px;
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

export const RemoveFormErrorBox = styled(ErrorBox)`
  margin-right: 1.5rem;
  margin-left: 1.5rem;
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
`;

export const RoundBox = styled(UnstyledBox)`
  --color: var(--color-white);
  --outline-color: var(--color-primary);
  background-color: var(--color);
  font-size: ${16 / 16}rem;
  padding: 10px 15px;
  margin: 1rem 0 2rem;
  flex: 2;
  display: flex;
  &:not(:first-of-type):focus-within {
    outline: 1px solid var(--outline-color);
  }
`;

export const MaxButton = styled(SecondaryButtonWithoutShadow)`
  text-transform: uppercase;
  padding: 10px 20px;
  font-size: ${14 / 16}rem;
  transition: background-color 100ms linear;

  &:hover {
    background-color: var(--color-gray-300);
  }
`;

export const Input = styled.input`
  border: none;
  font-size: inherit;
  background-color: inherit;
  padding: 0;
  margin: 0;
  width: 100%;
  text-align: right;
  outline: none;

  &::placeholder {
    color: var(--color-gray-300);
  }
`;

export const LiquidityErrorBox = styled(ErrorBox)`
  margin-top: 10px;
`;
